import React from 'react';
import { 
  Boxes, 
  RefreshCw, 
  Heart, 
  Github, 
  DownloadCloud, 
  ShoppingBag, 
  Radio, 
  ExternalLink,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  servers = [],
  activeServerId,
  onSelectServer,
  onOpenSync,
  onOpenMarketplace,
  onOpenSponsors,
  wsConnected,
  onRefresh
}) {
  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];

  return (
    <header className="h-14 border-b border-white/10 bg-[#0c101d]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                MCP Studio
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v1.0.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
              Visual DevTools & Postman for Model Context Protocol
            </p>
          </div>
        </div>

        {/* Live Server Selector Dropdown */}
        <div className="ml-4 pl-4 border-l border-white/10 hidden md:flex items-center space-x-2">
          <span className="text-xs text-slate-400">Target Server:</span>
          <div className="relative group">
            <select
              value={activeServerId || ''}
              onChange={(e) => onSelectServer(e.target.value)}
              className="appearance-none bg-slate-900/90 text-xs text-slate-200 pl-3 pr-8 py-1.5 rounded-md border border-white/10 hover:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer transition-all"
            >
              {servers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.status === 'running' ? '● ' : '○ '} {s.name} ({s.toolCount || 0} tools)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
          {activeServer && (
            <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium ${
              activeServer.status === 'running' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                activeServer.status === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`} />
              {activeServer.status}
            </span>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2">
        {/* WebSocket Realtime Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-white/5 text-[11px]">
          <Radio className={`w-3 h-3 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span className={wsConnected ? 'text-slate-300' : 'text-amber-400'}>
            {wsConnected ? 'RPC Live' : 'Connecting'}
          </span>
        </div>

        {/* Sync to Claude & Cursor Button */}
        <button
          onClick={onOpenSync}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-white/10 hover:border-purple-500/40 transition-all shadow-sm"
          title="Export and sync configs with Claude Desktop & Cursor"
        >
          <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Config Sync</span>
        </button>

        {/* Marketplace Button */}
        <button
          onClick={onOpenMarketplace}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-xs font-medium text-purple-200 border border-purple-500/30 hover:border-purple-500/60 transition-all shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Marketplace</span>
          <span className="text-[10px] bg-purple-500/40 px-1 rounded text-purple-200">20+</span>
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/Yaromir-Anokhin/mcp-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-white/10 hover:border-white/20 transition-all"
        >
          <Github className="w-3.5 h-3.5 text-white" />
          <span className="font-mono text-[11px]">GitHub</span>
        </a>

        {/* Sponsor Heart Button */}
        <button
          onClick={onOpenSponsors}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-medium border border-pink-500/30 hover:border-pink-500/50 transition-all shadow-sm shadow-pink-500/10"
          title="Sponsor MCP Studio development"
        >
          <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/30" />
          <span className="hidden lg:inline">Sponsor</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="Refresh server data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
