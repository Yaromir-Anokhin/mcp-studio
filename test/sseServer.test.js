import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { mcpManager } from '../server/mcpManager.js';

describe('Remote SSE Transport Tests', () => {
  it('connects to remote MCP SSE server, discovers endpoint, and executes tools', async () => {
    let mockClientResponse = null;

    // Create a mock SSE MCP Server
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (req.method === 'GET' && url.pathname === '/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        mockClientResponse = res;

        // Send endpoint event discovery
        const port = server.address().port;
        res.write(`event: endpoint\ndata: http://127.0.0.1:${port}/messages\n\n`);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/messages') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          const payload = JSON.parse(body);
          const reqId = payload.id;
          const method = payload.method;

          let result = {};
          if (method === 'initialize') {
            result = {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: 'Mock Remote SSE MCP', version: '1.0.0' }
            };
          } else if (method === 'tools/list') {
            result = {
              tools: [
                {
                  name: 'remote_echo',
                  description: 'Echoes message from cloud MCP',
                  inputSchema: {
                    type: 'object',
                    properties: { message: { type: 'string' } }
                  }
                }
              ]
            };
          } else if (method === 'tools/call') {
            result = {
              content: [{ type: 'text', text: `Echo: ${payload.params?.arguments?.message || ''}` }]
            };
          }

          // Return response directly via JSON HTTP response or SSE stream
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id: reqId, result }));
        });
        return;
      }

      res.writeHead(404);
      res.end('Not found');
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const sseUrl = `http://127.0.0.1:${port}/sse`;

    // Add server to MCP Studio manager
    const srv = mcpManager.addServer({
      name: 'Mock SSE Server',
      type: 'sse',
      url: sseUrl
    });

    try {
      // Start server connection
      await mcpManager.startServer(srv.id);

      // Wait a moment for handshake
      await new Promise(r => setTimeout(r, 200));

      const updated = mcpManager.getServer(srv.id);
      assert.equal(updated.status, 'running', 'SSE Server should be running');
      assert.equal(updated.tools.length, 1, 'Should discover 1 remote tool');
      assert.equal(updated.tools[0].name, 'remote_echo');

      // Call tool over SSE
      const callResult = await mcpManager.sendRpcRequest(srv.id, 'tools/call', {
        name: 'remote_echo',
        arguments: { message: 'Hello from MCP Studio test!' }
      });

      assert.ok(callResult.content);
      assert.equal(callResult.content[0].text, 'Echo: Hello from MCP Studio test!');
    } finally {
      mcpManager.stopServer(srv.id);
      mcpManager.deleteServer(srv.id);
      if (mockClientResponse) mockClientResponse.end();
      server.close();
    }
  });
});
