import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  ArrowDown, 
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ConsoleLogs({ logs = [], serverName, onClear }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'stdout' | 'stderr' | 'error'
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.level === filter;
  });

  const copyAll = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c101d] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-[#0f1424] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Process Console & Output Logs</h2>
            <p className="text-xs text-slate-400">
              Monitoring stdout/stderr streams for <strong>{serverName || 'MCP Server'}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Level Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 px-2.5 py-1.5 rounded-md border border-white/10 focus:outline-none cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="stdout">stdout</option>
            <option value="stderr">stderr</option>
            <option value="info">info</option>
            <option value="error">error</option>
          </select>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1.5 rounded-md text-xs border flex items-center space-x-1 ${
              autoScroll
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-900 text-slate-400 border-white/10'
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          {/* Copy all */}
          <button
            onClick={copyAll}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={scrollRef}
        className="flex-1 bg-[#090c15] p-4 overflow-y-auto font-mono text-xs space-y-1"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 font-sans text-xs">
            No console output recorded for this process.
          </div>
        ) : (
          filteredLogs.map((l, i) => (
            <div key={i} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-slate-400 shrink-0 select-none">
                [{l.timestamp}]
              </span>
              <span className={`px-1 rounded text-[10px] uppercase font-bold shrink-0 ${
                l.level === 'stderr' || l.level === 'error'
                  ? 'bg-red-500/20 text-red-300'
                  : l.level === 'stdout'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {l.level}
              </span>
              <span className={`whitespace-pre-wrap break-all ${
                l.level === 'stderr' || l.level === 'error'
                  ? 'text-red-200'
                  : 'text-slate-200'
              }`}>
                {l.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
