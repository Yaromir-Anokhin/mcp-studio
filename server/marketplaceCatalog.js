/**
 * Curated Catalog of Official & Top Community MCP Servers
 * Includes 1-click configuration schemas for fast testing and installation.
 */

export const MARKETPLACE_SERVERS = [
  {
    id: 'mcp-server-filesystem',
    name: 'Filesystem',
    author: 'Anthropic (Official)',
    category: 'Local & System',
    description: 'Secure, configurable direct access to read, write, and list local filesystem directories.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', 'C:/'],
    env: {},
    tags: ['Official', 'Files', 'Read/Write', 'Essential'],
    icon: 'Folder'
  },
  {
    id: 'mcp-server-github',
    name: 'GitHub',
    author: 'Anthropic (Official)',
    category: 'Developer Tools',
    description: 'Interact with GitHub repositories, pull requests, issues, commits, branches, and code search.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: ''
    },
    tags: ['Official', 'Git', 'Pull Requests', 'CI/CD'],
    icon: 'GitPullRequest'
  },
  {
    id: 'mcp-server-sqlite',
    name: 'SQLite Database',
    author: 'Anthropic (Official)',
    category: 'Databases',
    description: 'Query, inspect schemas, create tables, and analyze SQLite database files with full SQL support.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    stars: 38200,
    transport: 'stdio',
    command: 'uvx',
    args: ['mcp-server-sqlite', '--db-path', 'test.db'],
    env: {},
    tags: ['Official', 'SQL', 'Local Database'],
    icon: 'Database'
  },
  {
    id: 'mcp-server-postgres',
    name: 'PostgreSQL',
    author: 'Anthropic (Official)',
    category: 'Databases',
    description: 'Read-only and read-write SQL operations, schema reflection, and table inspection for PostgreSQL.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
    env: {},
    tags: ['Official', 'Postgres', 'Enterprise'],
    icon: 'Database'
  },
  {
    id: 'mcp-server-brave-search',
    name: 'Brave Search',
    author: 'Anthropic (Official)',
    category: 'Search & Web',
    description: 'Fast, privacy-focused real-time web search and local location search via Brave Search API.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      BRAVE_API_KEY: ''
    },
    tags: ['Official', 'Web Search', 'Privacy'],
    icon: 'Search'
  },
  {
    id: 'mcp-server-fetch',
    name: 'Fetch & Scraper',
    author: 'Anthropic (Official)',
    category: 'Search & Web',
    description: 'Fetch web pages, convert HTML to clean markdown for LLMs, and handle redirects safely.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    stars: 38200,
    transport: 'stdio',
    command: 'uvx',
    args: ['mcp-server-fetch'],
    env: {},
    tags: ['Official', 'Web', 'Reader Mode'],
    icon: 'Globe'
  },
  {
    id: 'mcp-server-memory',
    name: 'Memory Graph (Knowledge)',
    author: 'Anthropic (Official)',
    category: 'AI & Knowledge',
    description: 'Persistent knowledge-graph based memory for LLMs across conversations and sessions.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
    tags: ['Official', 'Knowledge Graph', 'Long-term Memory'],
    icon: 'Brain'
  },
  {
    id: 'mcp-server-puppeteer',
    name: 'Puppeteer Browser Automation',
    author: 'Anthropic (Official)',
    category: 'Automation',
    description: 'Headless browser automation: navigate web pages, click elements, fill forms, and take screenshots.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
    env: {},
    tags: ['Official', 'Browser', 'Screenshots', 'Testing'],
    icon: 'Monitor'
  },
  {
    id: 'mcp-server-docker',
    name: 'Docker Engine',
    author: 'Community',
    category: 'DevOps & Cloud',
    description: 'Manage Docker containers, list images, inspect container logs, and execute health checks.',
    github: 'https://github.com/mcp-community/mcp-server-docker',
    stars: 2150,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'mcp-server-docker'],
    env: {},
    tags: ['Community', 'Docker', 'DevOps', 'Containers'],
    icon: 'Box'
  },
  {
    id: 'mcp-server-slack',
    name: 'Slack Workspaces',
    author: 'Anthropic (Official)',
    category: 'Productivity',
    description: 'Read channels, send messages, reply in threads, and search message history in Slack.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: '',
      SLACK_TEAM_ID: ''
    },
    tags: ['Official', 'Team Chat', 'Collaboration'],
    icon: 'MessageSquare'
  },
  {
    id: 'mcp-server-git',
    name: 'Local Git Repo Tools',
    author: 'Anthropic (Official)',
    category: 'Developer Tools',
    description: 'Read commit logs, diffs, stage files, check git status, and switch local branches.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    stars: 38200,
    transport: 'stdio',
    command: 'uvx',
    args: ['mcp-server-git', '--repository', '.'],
    env: {},
    tags: ['Official', 'Git', 'Code Review'],
    icon: 'GitBranch'
  },
  {
    id: 'mcp-server-google-drive',
    name: 'Google Drive',
    author: 'Anthropic (Official)',
    category: 'Productivity',
    description: 'Search documents, read spreadsheets and files directly from Google Drive workspace.',
    github: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
    stars: 38200,
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-gdrive'],
    env: {},
    tags: ['Official', 'Cloud Storage', 'Documents'],
    icon: 'HardDrive'
  }
];
