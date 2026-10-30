#!/usr/bin/env node
import { exec } from 'child_process';

process.env.PORT = process.env.PORT || '3000';

// Start server
await import('../server/index.js');

const port = process.env.PORT;
const url = `http://localhost:${port}`;

console.log(`\n⚡ MCP Studio launched successfully!`);
console.log(`🌐 Opening workbench in browser: ${url}\n`);

const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
try {
  exec(`${startCmd} ${url}`, () => {});
} catch {
  // Silent fallback if graphical desktop is unavailable (e.g. headless CI)
}
