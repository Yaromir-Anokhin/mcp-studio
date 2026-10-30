import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { BUILTIN_SERVERS } from './builtinServers.js';

const CONFIG_FILE = path.join(process.cwd(), 'server', 'mcp_servers.json');

class MCPManager {
  constructor() {
    this.servers = new Map();
    this.processes = new Map();
    this.logs = new Map(); // serverId -> array of log objects
    this.traffic = []; // JSON-RPC 2.0 traffic history
    this.wsClients = new Set();
    this.reqIdCounter = 1;
    this.pendingRequests = new Map(); // reqId -> { resolve, reject, timer, serverId, method }
    this.sseConnections = new Map(); // serverId -> { controller, postUrl, sseUrl }

    this.loadPersistedServers();
  }

  setWsClients(clients) {
    this.wsClients = clients;
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const client of this.wsClients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  recordTraffic(packet) {
    const entry = {
      id: packet.id || `rpc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      serverId: packet.serverId,
      serverName: packet.serverName,
      direction: packet.direction, // 'outgoing' | 'incoming'
      method: packet.method,
      params: packet.params,
      result: packet.result,
      error: packet.error,
      latencyMs: packet.latencyMs || null
    };

    this.traffic.unshift(entry);
    if (this.traffic.length > 500) {
      this.traffic.pop();
    }

    this.broadcast('TRAFFIC_UPDATE', entry);
    return entry;
  }

  appendLog(serverId, level, message) {
    if (!this.logs.has(serverId)) {
      this.logs.set(serverId, []);
    }
    const logList = this.logs.get(serverId);
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level, // 'info' | 'warn' | 'error' | 'stdout' | 'stderr'
      message
    };
    logList.push(entry);
    if (logList.length > 200) logList.shift();

    this.broadcast('LOG_ENTRY', { serverId, entry });
  }

  loadPersistedServers() {
    // Default built-in and sample servers
    const defaultList = [
      {
        id: 'builtin-system',
        name: 'System Diagnostics MCP',
        type: 'builtin',
        builtinKey: 'builtin-system',
        status: 'running',
        command: 'builtin',
        args: [],
        env: {},
        tools: BUILTIN_SERVERS['builtin-system'].tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        resources: BUILTIN_SERVERS['builtin-system'].resources,
        prompts: BUILTIN_SERVERS['builtin-system'].prompts,
        uptimeStart: Date.now()
      },
      {
        id: 'builtin-filesystem',
        name: 'Filesystem Safe Explorer',
        type: 'builtin',
        builtinKey: 'builtin-filesystem',
        status: 'running',
        command: 'builtin',
        args: [],
        env: {},
        tools: BUILTIN_SERVERS['builtin-filesystem'].tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        resources: BUILTIN_SERVERS['builtin-filesystem'].resources,
        prompts: BUILTIN_SERVERS['builtin-filesystem'].prompts,
        uptimeStart: Date.now()
      },
      {
        id: 'builtin-web',
        name: 'Web & Search Simulator',
        type: 'builtin',
        builtinKey: 'builtin-web',
        status: 'running',
        command: 'builtin',
        args: [],
        env: {},
        tools: BUILTIN_SERVERS['builtin-web'].tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
        resources: BUILTIN_SERVERS['builtin-web'].resources,
        prompts: BUILTIN_SERVERS['builtin-web'].prompts,
        uptimeStart: Date.now()
      },
      {
        id: 'stdio-custom-sqlite',
        name: 'SQLite Local MCP Server',
        type: 'stdio',
        status: 'stopped',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', 'workspace.db'],
        env: {},
        tools: [],
        resources: [],
        prompts: []
      }
    ];

    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const list = JSON.parse(raw);
        for (const s of list) {
          if (s.type === 'builtin' && BUILTIN_SERVERS[s.builtinKey]) {
            s.status = 'running';
            s.tools = BUILTIN_SERVERS[s.builtinKey].tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
            s.resources = BUILTIN_SERVERS[s.builtinKey].resources;
            s.prompts = BUILTIN_SERVERS[s.builtinKey].prompts;
            s.uptimeStart = Date.now();
          } else {
            s.status = 'stopped';
          }
          this.servers.set(s.id, s);
        }
      } else {
        for (const s of defaultList) {
          this.servers.set(s.id, s);
        }
        this.savePersistedServers();
      }
    } catch {
      for (const s of defaultList) {
        this.servers.set(s.id, s);
      }
    }
  }

  savePersistedServers() {
    try {
      const list = Array.from(this.servers.values()).map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        builtinKey: s.builtinKey,
        command: s.command,
        args: s.args,
        env: s.env,
        url: s.url,
        headers: s.headers,
        description: s.description
      }));
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save mcp_servers.json:', e);
    }
  }

  listServers() {
    return Array.from(this.servers.values()).map(s => ({
      ...s,
      toolCount: s.tools?.length || 0,
      resourceCount: s.resources?.length || 0,
      promptCount: s.prompts?.length || 0
    }));
  }

  getServer(id) {
    return this.servers.get(id);
  }

  addServer({ name, type = 'stdio', command = 'npx', args = [], env = {}, url = '', headers = {}, description = '' }) {
    const id = `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newServer = {
      id,
      name: name || (type === 'sse' ? 'Remote SSE MCP Server' : 'New MCP Server'),
      type,
      command: command || '',
      args: Array.isArray(args) ? args : (args ? args.split(' ').filter(Boolean) : []),
      env: env || {},
      url: url || '',
      headers: headers || {},
      description: description || '',
      status: 'stopped',
      tools: [],
      resources: [],
      prompts: []
    };
    this.servers.set(id, newServer);
    this.savePersistedServers();
    this.appendLog(id, 'info', `Server (${type}) added to MCP Studio configuration.`);
    return newServer;
  }

  deleteServer(id) {
    this.stopServer(id);
    const existed = this.servers.delete(id);
    this.savePersistedServers();
    return existed;
  }

  async startServer(id) {
    const server = this.servers.get(id);
    if (!server) throw new Error(`Server ${id} not found`);

    if (server.type === 'builtin') {
      const builtin = BUILTIN_SERVERS[server.builtinKey];
      if (builtin) {
        server.status = 'running';
        server.uptimeStart = Date.now();
        server.tools = builtin.tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          readOnlyHint: t.readOnlyHint,
          destructiveHint: t.destructiveHint,
          idempotentHint: t.idempotentHint,
          openWorldHint: t.openWorldHint,
          annotations: t.annotations
        }));
        server.resources = builtin.resources;
        server.prompts = builtin.prompts;
        this.appendLog(id, 'info', `Built-in server initialized with ${server.tools.length} tools.`);
        this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'running', server });
        return server;
      }
    }

    if (server.type === 'sse') {
      if (server.status === 'running') return server;
      server.status = 'starting';
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'starting' });
      this.appendLog(id, 'info', `Connecting to remote SSE stream: ${server.url}`);

      const controller = new AbortController();
      this.sseConnections.set(id, { controller, postUrl: null, sseUrl: server.url });
      this.connectSse(id, server, controller);
      return server;
    }

    if (server.status === 'running') {
      return server;
    }

    server.status = 'starting';
    this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'starting' });
    this.appendLog(id, 'info', `Spawning process: ${server.command} ${server.args.join(' ')}`);

    try {
      const isWindows = process.platform === 'win32';
      let cmd = server.command;
      if (isWindows && (cmd === 'npx' || cmd === 'npm' || cmd === 'uvx')) {
        cmd = `${cmd}.cmd`;
      }

      const child = spawn(cmd, server.args, {
        env: { ...process.env, ...server.env },
        shell: false
      });

      this.processes.set(id, child);
      let buffer = '';

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        this.appendLog(id, 'stdout', text.trim());
        buffer += text;

        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete chunk

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            this.handleRpcResponse(id, parsed);
          } catch {
            // Non-JSON stdout or partial data
          }
        }
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        this.appendLog(id, 'stderr', text.trim());
      });

      child.on('error', (err) => {
        this.appendLog(id, 'error', `Process error: ${err.message}`);
        server.status = 'error';
        this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'error', error: err.message });
      });

      child.on('close', (code) => {
        this.appendLog(id, 'info', `Process exited with code ${code}`);
        server.status = 'stopped';
        this.processes.delete(id);
        this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'stopped', exitCode: code });
      });

      // Send MCP initialize handshake
      server.status = 'running';
      server.uptimeStart = Date.now();
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'running', server });

      await this.sendRpcRequest(id, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: 'MCP-Studio', version: '1.0.0' }
      }).catch(e => {
        this.appendLog(id, 'warn', `Initialize handshake timed out or deferred: ${e.message}`);
      });

      // Fetch tools list
      try {
        const toolsResult = await this.sendRpcRequest(id, 'tools/list', {});
        if (toolsResult?.tools) {
          server.tools = toolsResult.tools;
          this.appendLog(id, 'info', `Discovered ${server.tools.length} tools via tools/list`);
        }
      } catch {
        // Fallback or empty tools
      }

      return server;
    } catch (err) {
      server.status = 'error';
      this.appendLog(id, 'error', `Failed to start: ${err.message}`);
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'error', error: err.message });
      throw err;
    }
  }

  stopServer(id) {
    const server = this.servers.get(id);
    if (!server) return false;

    if (server.type === 'builtin') {
      server.status = 'stopped';
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'stopped' });
      this.appendLog(id, 'info', 'Built-in server stopped.');
      return true;
    }

    if (server.type === 'sse') {
      const conn = this.sseConnections.get(id);
      if (conn?.controller) {
        conn.controller.abort();
      }
      this.sseConnections.delete(id);
      server.status = 'stopped';
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'stopped' });
      this.appendLog(id, 'info', 'SSE remote connection closed.');
      return true;
    }

    const child = this.processes.get(id);
    if (child) {
      try {
        child.kill();
      } catch {}
      this.processes.delete(id);
    }
    server.status = 'stopped';
    this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'stopped' });
    this.appendLog(id, 'info', 'Server process terminated.');
    return true;
  }

  async sendRpcRequest(serverId, method, params = {}) {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Server ${serverId} not found`);

    const reqId = this.reqIdCounter++;
    const rpcPayload = {
      jsonrpc: '2.0',
      id: reqId,
      method,
      params
    };

    const startTime = Date.now();

    this.recordTraffic({
      serverId,
      serverName: server.name,
      direction: 'outgoing',
      method,
      params,
      id: reqId
    });

    if (server.type === 'builtin') {
      const builtin = BUILTIN_SERVERS[server.builtinKey];
      if (!builtin) throw new Error(`Built-in server ${server.builtinKey} missing`);

      let result = null;
      let error = null;

      if (method === 'initialize') {
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: builtin.name, version: builtin.version }
        };
      } else if (method === 'tools/list') {
        result = {
          tools: builtin.tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
            readOnlyHint: t.readOnlyHint,
            destructiveHint: t.destructiveHint,
            idempotentHint: t.idempotentHint,
            openWorldHint: t.openWorldHint,
            annotations: t.annotations
          }))
        };
      } else if (method === 'resources/list') {
        result = { resources: builtin.resources };
      } else if (method === 'prompts/list') {
        result = { prompts: builtin.prompts };
      } else if (method === 'tools/call') {
        const tool = builtin.tools.find(t => t.name === params.name);
        if (!tool) {
          error = { code: -32601, message: `Tool not found: ${params.name}` };
        } else {
          try {
            const data = await tool.handler(params.arguments);
            result = {
              content: [
                {
                  type: 'text',
                  text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
                }
              ]
            };
          } catch (e) {
            error = { code: -32000, message: e.message };
          }
        }
      } else {
        error = { code: -32601, message: `Method not implemented: ${method}` };
      }

      const latencyMs = Date.now() - startTime;
      this.recordTraffic({
        serverId,
        serverName: server.name,
        direction: 'incoming',
        method,
        result,
        error,
        latencyMs,
        id: reqId
      });

      if (error) throw new Error(error.message);
      return result;
    }

    if (server.type === 'sse') {
      const conn = this.sseConnections.get(serverId);
      const postUrl = conn?.postUrl || server.url;

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingRequests.delete(reqId);
          const err = new Error(`JSON-RPC request '${method}' timed out after 30000ms`);
          this.recordTraffic({
            serverId,
            serverName: server.name,
            direction: 'incoming',
            method,
            error: { message: err.message },
            latencyMs: 30000,
            id: reqId
          });
          reject(err);
        }, 30000);

        this.pendingRequests.set(reqId, {
          resolve,
          reject,
          timer,
          serverId,
          serverName: server.name,
          method,
          startTime
        });

        fetch(postUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(server.headers || {})
          },
          body: JSON.stringify(rpcPayload)
        })
          .then(async (res) => {
            if (!res.ok) {
              const errText = await res.text().catch(() => '');
              throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
            }
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const body = await res.json().catch(() => null);
              if (body && (body.result !== undefined || body.error !== undefined)) {
                this.handleRpcResponse(serverId, body);
              }
            }
          })
          .catch((err) => {
            clearTimeout(timer);
            this.pendingRequests.delete(reqId);
            this.appendLog(serverId, 'error', `POST request failed (${method}): ${err.message}`);
            this.recordTraffic({
              serverId,
              serverName: server.name,
              direction: 'incoming',
              method,
              error: { message: err.message },
              latencyMs: Date.now() - startTime,
              id: reqId
            });
            reject(err);
          });
      });
    }

    // stdio external server communication
    const child = this.processes.get(serverId);
    if (!child || !child.stdin) {
      throw new Error(`Server ${server.name} is not running or stdin is unavailable`);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        const err = new Error(`JSON-RPC request '${method}' timed out after 10000ms`);
        this.recordTraffic({
          serverId,
          serverName: server.name,
          direction: 'incoming',
          method,
          error: { message: err.message },
          latencyMs: 10000,
          id: reqId
        });
        reject(err);
      }, 10000);

      this.pendingRequests.set(reqId, {
        resolve,
        reject,
        timer,
        serverId,
        serverName: server.name,
        method,
        startTime
      });

      child.stdin.write(JSON.stringify(rpcPayload) + '\n');
    });
  }

  handleRpcResponse(serverId, payload) {
    if (!payload || typeof payload !== 'object') return;
    const reqId = payload.id;
    if (reqId && this.pendingRequests.has(reqId)) {
      const pending = this.pendingRequests.get(reqId);
      clearTimeout(pending.timer);
      this.pendingRequests.delete(reqId);

      const latencyMs = Date.now() - pending.startTime;

      this.recordTraffic({
        serverId,
        serverName: pending.serverName,
        direction: 'incoming',
        method: pending.method,
        result: payload.result,
        error: payload.error,
        latencyMs,
        id: reqId
      });

      if (payload.error) {
        pending.reject(new Error(payload.error.message || 'RPC Error'));
      } else {
        pending.resolve(payload.result);
      }
    }
  }

  async callTool(serverId, toolName, args = {}) {
    return this.sendRpcRequest(serverId, 'tools/call', {
      name: toolName,
      arguments: args
    });
  }

  getLogs(serverId) {
    return this.logs.get(serverId) || [];
  }

  getTraffic() {
    return this.traffic;
  }

  async connectSse(id, server, controller) {
    try {
      const headers = {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...(server.headers || {})
      };

      const res = await fetch(server.url, {
        headers,
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      this.appendLog(id, 'info', `SSE stream opened. Listening for server messages...`);

      server.status = 'running';
      server.uptimeStart = Date.now();
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'running', server });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let currentEvent = 'message';
      let currentData = '';

      const handleEventBlock = async () => {
        if (!currentData) return;
        const text = currentData.trim();
        const evt = currentEvent;
        currentData = '';
        currentEvent = 'message';

        if (evt === 'endpoint') {
          let postUrl = text;
          try {
            postUrl = new URL(text, server.url).toString();
          } catch {
            postUrl = text;
          }
          const conn = this.sseConnections.get(id);
          if (conn) {
            conn.postUrl = postUrl;
            this.appendLog(id, 'info', `Discovered POST message endpoint: ${postUrl}`);

            // Perform MCP initialize handshake
            try {
              await this.sendRpcRequest(id, 'initialize', {
                protocolVersion: '2024-11-05',
                capabilities: { roots: { listChanged: true } },
                clientInfo: { name: 'MCP-Studio', version: '1.0.0' }
              });

              const toolsResult = await this.sendRpcRequest(id, 'tools/list', {});
              if (toolsResult?.tools) {
                server.tools = toolsResult.tools;
                this.appendLog(id, 'info', `Discovered ${server.tools.length} remote tools via tools/list`);
                this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'running', server });
              }
            } catch (e) {
              this.appendLog(id, 'warn', `Handshake note: ${e.message}`);
            }
          }
        } else if (evt === 'message') {
          try {
            const parsed = JSON.parse(text);
            this.handleRpcResponse(id, parsed);
          } catch {
            this.appendLog(id, 'stdout', `SSE text: ${text}`);
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === '') {
            await handleEventBlock();
            continue;
          }
          if (trimmed.startsWith(':')) {
            continue;
          }
          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim();
          } else if (trimmed.startsWith('data:')) {
            const dataSlice = trimmed.slice(5).trim();
            currentData = currentData ? `${currentData}\n${dataSlice}` : dataSlice;
          }
        }
      }

      this.appendLog(id, 'info', `SSE stream closed by remote server.`);
      server.status = 'stopped';
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'stopped' });
    } catch (err) {
      if (controller.signal.aborted) {
        this.appendLog(id, 'info', `SSE disconnected.`);
        return;
      }
      this.appendLog(id, 'error', `SSE stream error: ${err.message}`);
      server.status = 'error';
      this.broadcast('SERVER_STATUS_CHANGED', { id, status: 'error', error: err.message });
    } finally {
      this.sseConnections.delete(id);
    }
  }
}

export const mcpManager = new MCPManager();
