import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Handles detection, reading, and 1-click synchronization of MCP server configs
 * with Claude Desktop and Cursor.
 */

export function getKnownConfigPaths() {
  const home = os.homedir();
  const platform = os.platform();

  let claudePath = '';
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    claudePath = path.join(appData, 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'darwin') {
    claudePath = path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    claudePath = path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }

  const cursorPath = path.join(home, '.cursor', 'mcp.json');

  return {
    claude: {
      name: 'Claude Desktop',
      path: claudePath,
      exists: fs.existsSync(claudePath)
    },
    cursor: {
      name: 'Cursor Editor',
      path: cursorPath,
      exists: fs.existsSync(cursorPath)
    }
  };
}

export function readConfig(target = 'claude') {
  const targets = getKnownConfigPaths();
  const targetInfo = targets[target];
  if (!targetInfo) {
    throw new Error(`Unknown target config: ${target}`);
  }

  if (!fs.existsSync(targetInfo.path)) {
    return {
      target,
      filePath: targetInfo.path,
      exists: false,
      mcpServers: {}
    };
  }

  try {
    const raw = fs.readFileSync(targetInfo.path, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      target,
      filePath: targetInfo.path,
      exists: true,
      mcpServers: parsed.mcpServers || {}
    };
  } catch (err) {
    return {
      target,
      filePath: targetInfo.path,
      exists: true,
      error: `Failed to parse JSON: ${err.message}`,
      mcpServers: {}
    };
  }
}

export function writeConfig(target = 'claude', serversMap = {}) {
  const targets = getKnownConfigPaths();
  const targetInfo = targets[target];
  if (!targetInfo) {
    throw new Error(`Unknown target config: ${target}`);
  }

  const dir = path.dirname(targetInfo.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let currentConfig = {};
  if (fs.existsSync(targetInfo.path)) {
    try {
      const raw = fs.readFileSync(targetInfo.path, 'utf-8');
      currentConfig = JSON.parse(raw);
      // Create backup
      fs.writeFileSync(`${targetInfo.path}.backup.${Date.now()}`, raw, 'utf-8');
    } catch {
      currentConfig = {};
    }
  }

  currentConfig.mcpServers = {
    ...(currentConfig.mcpServers || {}),
    ...serversMap
  };

  fs.writeFileSync(targetInfo.path, JSON.stringify(currentConfig, null, 2), 'utf-8');

  return {
    success: true,
    filePath: targetInfo.path,
    serverCount: Object.keys(currentConfig.mcpServers).length
  };
}
