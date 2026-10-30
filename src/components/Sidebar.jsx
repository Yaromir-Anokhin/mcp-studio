import React from 'react';
import { 
  Zap, 
  CheckSquare,
  Bot, 
  FolderTree, 
  Activity, 
  Sliders, 
  Store, 
  Terminal, 
  Plus, 
  Play, 
  Square, 
  Trash2, 
  RotateCw,
  Server as ServerIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  servers = [],
  activeServerId,
  onSelectServer,
  onStartServer,
  onStopServer,
  onDeleteServer,
  onOpenAddServer,
  trafficCount = 0
}) {
  const activeServer = servers.find(s => s.id === activeServerId);
  const totalTools = servers.reduce((acc, s) => acc + (s.toolCount || 0), 0);

  const navItems = [
    { id: 'tools', label: 'Tool Runner', icon: Zap, badge: totalTools > 0 ? `${totalTools}` : null, desc: 'Interactive Postman' },
    { id: 'suites', label: 'Test Suites & Assertions', icon: CheckSquare, badge: 'CI/CD', desc: 'Postman-style automated tests' },
    { id: 'agent', label: 'AI Playground', icon: Bot, badge: 'New', desc: 'Agent tool execution loop' },
    { id: 'resources', label: 'Resources & Prompts', icon: FolderTree, desc: 'Dynamic templates' },
    { id: 'network', label: 'Network / RPC', icon: Activity, badge: trafficCount > 0 ? `${trafficCount}` : null, desc: 'Live JSON-RPC traffic' },
    { id: 'sync', label: 'Config Sync', icon: Sliders, desc: 'Claude & Cursor sync' },
    { id: 'marketplace', label: 'Marketplace', icon: Store, badge: '20+', desc: '1-click install catalog' },
    { id: 'logs', label: 'Console Logs', icon: Terminal, desc: 'Process stderr/stdout' },
  ];

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0c101d] flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] select-none">
      {/* Top: Navigation Views */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1">
          Workspaces
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-purple-500/40 text-purple-100'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: Server Process Orchestrator */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center space-x-1.5">
            <ServerIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-300">MCP Servers</span>
          </div>
          <button
            onClick={onOpenAddServer}
            className="flex items-center space-x-1 text-[10px] bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 px-1.5 py-0.5 rounded border border-white/10 transition-colors"
            title="Add custom MCP server"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>

        {/* Server list scrollable */}
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {servers.map((srv) => {
            const isSelected = srv.id === activeServerId;
            const isRunning = srv.status === 'running';

            return (
              <div
                key={srv.id}
                onClick={() => onSelectServer(srv.id)}
                className={`p-2 rounded-md border text-xs cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-purple-500/50 shadow-sm'
                    : 'bg-slate-900/50 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center space-x-2 truncate min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`} />
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5 truncate">
                      {srv.type === 'sse' && (
                        <span className="text-[9px] font-bold px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                          SSE
                        </span>
                      )}
                      <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {srv.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      {srv.type === 'builtin'
                        ? 'In-process'
                        : srv.type === 'sse'
                        ? `${srv.url || 'Remote SSE Stream'}`
                        : `${srv.command} ${srv.args?.[0] || ''}`}
                    </p>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center space-x-1 shrink-0 ml-1">
                  {isRunning ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStopServer(srv.id); }}
                      className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Stop server"
                    >
                      <Square className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStartServer(srv.id); }}
                      className="p-1 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                      title="Start server"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}

                  {srv.type !== 'builtin' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteServer(srv.id); }}
                      className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Remove server"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
