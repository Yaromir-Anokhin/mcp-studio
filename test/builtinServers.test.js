import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SERVERS } from '../server/builtinServers.js';

describe('Builtin MCP Servers & Tools Verification', () => {
  const allTools = [];
  for (const [serverId, server] of Object.entries(BUILTIN_SERVERS)) {
    for (const tool of server.tools) {
      allTools.push({ serverId, tool });
    }
  }

  it('declares exactly 7 tools across builtin servers', () => {
    assert.equal(allTools.length, 7, 'Expected exactly 7 declared builtin tools');
  });

  it('ensures all tools declare required MCP hint annotations as booleans', () => {
    for (const { serverId, tool } of allTools) {
      assert.equal(
        typeof tool.readOnlyHint,
        'boolean',
        `Tool ${tool.name} in ${serverId} must have boolean readOnlyHint`
      );
      assert.equal(
        typeof tool.destructiveHint,
        'boolean',
        `Tool ${tool.name} in ${serverId} must have boolean destructiveHint`
      );
      assert.equal(
        typeof tool.idempotentHint,
        'boolean',
        `Tool ${tool.name} in ${serverId} must have boolean idempotentHint`
      );
      assert.equal(
        typeof tool.openWorldHint,
        'boolean',
        `Tool ${tool.name} in ${serverId} must have boolean openWorldHint`
      );
      assert.ok(tool.annotations, `Tool ${tool.name} must declare annotations object`);
      assert.equal(typeof tool.annotations.readOnlyHint, 'boolean');
      assert.equal(typeof tool.annotations.destructiveHint, 'boolean');
      assert.equal(typeof tool.annotations.idempotentHint, 'boolean');
      assert.equal(typeof tool.annotations.openWorldHint, 'boolean');
    }
  });

  describe('Tool execution tests', () => {
    it('executes get_system_specs correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-system'].tools.find(t => t.name === 'get_system_specs');
      assert.ok(tool, 'Tool get_system_specs must exist');
      const result = await tool.handler({ detailed: true });
      assert.ok(result.platform, 'Should return platform');
      assert.ok(result.arch, 'Should return architecture');
      assert.ok(result.cpuCount > 0, 'CPU count should be positive');
      assert.ok(result.totalMemoryMB > 0, 'Total memory should be positive');
    });

    it('executes get_memory_usage correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-system'].tools.find(t => t.name === 'get_memory_usage');
      assert.ok(tool, 'Tool get_memory_usage must exist');
      const result = await tool.handler({});
      assert.ok(result.rssMB, 'Should report rssMB');
      assert.ok(result.heapTotalMB, 'Should report heapTotalMB');
      assert.ok(result.heapUsedMB, 'Should report heapUsedMB');
      assert.ok(result.osFreePercent, 'Should report osFreePercent');
    });

    it('executes ping_service correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-system'].tools.find(t => t.name === 'ping_service');
      assert.ok(tool, 'Tool ping_service must exist');
      const result = await tool.handler({ host: '127.0.0.1' });
      assert.equal(result.host, '127.0.0.1');
      assert.equal(result.status, 'online');
      assert.ok(typeof result.latencyMs === 'number');
      assert.ok(result.timestamp);
    });

    it('executes list_directory correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-filesystem'].tools.find(t => t.name === 'list_directory');
      assert.ok(tool, 'Tool list_directory must exist');
      const result = await tool.handler({ directoryPath: '.' });
      assert.ok(result.count > 0, 'Directory should contain files');
      assert.ok(Array.isArray(result.items), 'Items should be an array');
      const pkg = result.items.find(i => i.name === 'package.json');
      assert.ok(pkg, 'Should find package.json in current directory');
    });

    it('executes read_file_head correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-filesystem'].tools.find(t => t.name === 'read_file_head');
      assert.ok(tool, 'Tool read_file_head must exist');
      const result = await tool.handler({ filePath: 'package.json', lines: 5 });
      assert.ok(result.content.includes('mcp-studio'), 'Content should include mcp-studio');
      assert.equal(result.previewLines, 5);
      assert.ok(result.totalBytes > 0);
    });

    it('executes fetch_markdown correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-web'].tools.find(t => t.name === 'fetch_markdown');
      assert.ok(tool, 'Tool fetch_markdown must exist');
      const result = await tool.handler({ url: 'https://example.com' });
      assert.equal(result.status, 200);
      assert.ok(result.markdown.includes('Document Content'));
      assert.ok(result.wordCount > 0);
    });

    it('executes search_knowledge correctly', async () => {
      const tool = BUILTIN_SERVERS['builtin-web'].tools.find(t => t.name === 'search_knowledge');
      assert.ok(tool, 'Tool search_knowledge must exist');
      const result = await tool.handler({ query: 'MCP' });
      assert.ok(result.totalFound >= 1);
      assert.ok(Array.isArray(result.results));
      assert.ok(result.results[0].title);
      assert.ok(result.results[0].url);
    });
  });
});
