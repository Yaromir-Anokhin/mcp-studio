import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { mcpManager } from './mcpManager.js';
import { MARKETPLACE_SERVERS } from './marketplaceCatalog.js';
import { getKnownConfigPaths, readConfig, writeConfig } from './configSync.js';
import { runAgentLoop } from './agentSimulator.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'MCP Studio Realtime Link Established' }));

  ws.on('close', () => {
    wsClients.delete(ws);
  });
});

mcpManager.setWsClients(wsClients);

// --- REST Endpoints ---

// Status & Telemetry
app.get('/api/status', (req, res) => {
  const servers = mcpManager.listServers();
  const running = servers.filter(s => s.status === 'running');
  const totalTools = running.reduce((sum, s) => sum + (s.toolCount || 0), 0);
  const totalTraffic = mcpManager.getTraffic().length;

  res.json({
    status: 'online',
    version: '1.0.0',
    totalServers: servers.length,
    runningServers: running.length,
    totalTools,
    totalTraffic,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Servers Management
app.get('/api/servers', (req, res) => {
  res.json(mcpManager.listServers());
});

app.post('/api/servers', (req, res) => {
  try {
    const created = mcpManager.addServer(req.body);
    res.json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/servers/:id', (req, res) => {
  const deleted = mcpManager.deleteServer(req.params.id);
  res.json({ success: deleted });
});

app.post('/api/servers/:id/start', async (req, res) => {
  try {
    const srv = await mcpManager.startServer(req.params.id);
    res.json(srv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/servers/:id/stop', (req, res) => {
  const stopped = mcpManager.stopServer(req.params.id);
  res.json({ success: stopped });
});

// Tools Execution (Postman-style)
app.get('/api/servers/:id/tools', (req, res) => {
  const srv = mcpManager.getServer(req.params.id);
  if (!srv) return res.status(404).json({ error: 'Server not found' });
  res.json(srv.tools || []);
});

app.post('/api/servers/:id/tools/call', async (req, res) => {
  const { toolName, arguments: toolArgs } = req.body;
  if (!toolName) return res.status(400).json({ error: 'toolName is required' });

  const start = Date.now();
  try {
    const result = await mcpManager.callTool(req.params.id, toolName, toolArgs || {});
    res.json({
      success: true,
      latencyMs: Date.now() - start,
      result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      latencyMs: Date.now() - start,
      error: err.message
    });
  }
});

// Resources & Prompts
app.get('/api/servers/:id/resources', (req, res) => {
  const srv = mcpManager.getServer(req.params.id);
  if (!srv) return res.status(404).json({ error: 'Server not found' });
  res.json(srv.resources || []);
});

app.get('/api/servers/:id/prompts', (req, res) => {
  const srv = mcpManager.getServer(req.params.id);
  if (!srv) return res.status(404).json({ error: 'Server not found' });
  res.json(srv.prompts || []);
});

// Logs & Console
app.get('/api/servers/:id/logs', (req, res) => {
  res.json(mcpManager.getLogs(req.params.id));
});

// Network / Traffic Monitor
app.get('/api/traffic', (req, res) => {
  res.json(mcpManager.getTraffic());
});

app.delete('/api/traffic', (req, res) => {
  mcpManager.traffic = [];
  res.json({ success: true });
});

// Marketplace
app.get('/api/marketplace', (req, res) => {
  res.json(MARKETPLACE_SERVERS);
});

app.post('/api/marketplace/install', (req, res) => {
  const { id, customEnv } = req.body;
  const item = MARKETPLACE_SERVERS.find(m => m.id === id);
  if (!item) return res.status(404).json({ error: 'Marketplace item not found' });

  const created = mcpManager.addServer({
    name: item.name,
    type: item.transport,
    command: item.command,
    args: item.args,
    env: { ...(item.env || {}), ...(customEnv || {}) },
    description: item.description
  });

  res.json({ success: true, server: created });
});

// Config Sync (Claude Desktop & Cursor)
app.get('/api/config/detect', (req, res) => {
  res.json(getKnownConfigPaths());
});

app.get('/api/config/read', (req, res) => {
  const target = req.query.target || 'claude';
  try {
    const data = readConfig(target);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config/sync', (req, res) => {
  const { target = 'claude', serverIds } = req.body;
  const servers = mcpManager.listServers();
  const filtered = serverIds ? servers.filter(s => serverIds.includes(s.id)) : servers;

  const map = {};
  for (const s of filtered) {
    if (s.type === 'stdio') {
      map[s.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')] = {
        command: s.command,
        args: s.args,
        env: s.env || {}
      };
    }
  }

  try {
    const result = writeConfig(target, map);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Agent Simulator
app.post('/api/agent/chat', async (req, res) => {
  const { prompt, apiKey, model, provider } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const response = await runAgentLoop({ prompt, apiKey, model, provider });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [MCP Studio] Backend Engine listening on http://localhost:${PORT}`);
  console.log(`📡 WebSocket RPC channel ready on ws://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
