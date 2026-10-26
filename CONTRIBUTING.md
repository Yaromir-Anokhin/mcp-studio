# Contributing to MCP Studio

Thank you for your interest in contributing to **MCP Studio**!

MCP Studio is an open-source visual DevTools platform for Anthropic's Model Context Protocol (MCP). We welcome contributions from developers, designers, and documentation writers.

---

## 🛠️ Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Yaromir-Anokhin/mcp-studio.git
   cd mcp-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development environment:
   ```bash
   npm start
   ```
   - Frontend runs on: `http://localhost:3000`
   - Backend API runs on: `http://localhost:3001`

---

## 💡 What Can You Help With?

- **New Built-in / Marketplace MCP Servers**: Add curated servers to `server/marketplaceCatalog.js`.
- **Desktop Packaging**: Help maintain the Tauri v2 desktop wrapper.
- **Protocol Extensions**: Add support for MCP Sampling, Notification subscriptions, and Roots management.
- **UI Enhancements**: Improve schema form inputs, code editors, and keyboard shortcuts.

---

## 📜 Pull Request Guidelines

1. Create a descriptive branch: `git checkout -b feature/my-new-feature`
2. Test your changes locally.
3. Commit with concise messages: `git commit -m 'feat: add schema array inputs in ToolRunner'`
4. Open a Pull Request referencing any related issues.

Thank you for helping push the open AI developer ecosystem forward!
