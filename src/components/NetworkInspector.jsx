import React, { useState } from 'react';
import { 
  Activity, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Trash2, 
  Download, 
  Filter, 
  Search, 
  Code2, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';

export default function NetworkInspector({
  traffic = [],
  onClearTraffic
}) {
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  const filteredTraffic = traffic.filter((pkt) => {
    const matchesSearch = 
      (pkt.method && pkt.method.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (pkt.serverName && pkt.serverName.toLowerCase().includes(searchFilter.toLowerCase()));
    
    if (methodFilter === 'all') return matchesSearch;
    return matchesSearch && pkt.method === methodFilter;
  });

  const exportToJson = () => {
    const blob = new Blob([JSON.stringify(traffic, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-rpc-traffic-${Date.now()}.json`;
    a.click();
  };

  const copyPayload = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c101d] overflow-hidden">
      {/* Top Header & Filter Bar */}
      <div className="p-4 border-b border-white/10 bg-[#0f1424] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">JSON-RPC 2.0 Traffic Monitor</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                {traffic.length} packets
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live inspection of standard JSON-RPC requests, responses, and round-trip latencies
            </p>
          </div>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter method or server..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-md border border-white/10 focus:outline-none focus:border-purple-500 w-44 placeholder-slate-400"
            />
          </div>

          {/* Method filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 px-2.5 py-1.5 rounded-md border border-white/10 focus:outline-none cursor-pointer"
          >
            <option value="all">All Methods</option>
            <option value="tools/call">tools/call</option>
            <option value="tools/list">tools/list</option>
            <option value="initialize">initialize</option>
            <option value="resources/list">resources/list</option>
            <option value="prompts/list">prompts/list</option>
          </select>

          {/* Export JSON */}
          <button
            onClick={exportToJson}
            disabled={traffic.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-white/10 disabled:opacity-40"
            title="Export packets as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear */}
          <button
            onClick={onClearTraffic}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 text-xs transition-colors"
            title="Clear traffic history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Table & Inspector */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        {/* Packets Stream Table (2 columns on lg) */}
        <div className="lg:col-span-2 border-r border-white/10 overflow-y-auto bg-[#090c15]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0f1424] text-slate-400 text-[10px] uppercase tracking-wider sticky top-0 border-b border-white/10 z-10">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Dir</th>
                <th className="py-2.5 px-3">Server</th>
                <th className="py-2.5 px-3">RPC Method</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredTraffic.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-sans">
                    No JSON-RPC traffic recorded yet. Run a tool or start a server to see live packets.
                  </td>
                </tr>
              ) : (
                filteredTraffic.map((pkt, idx) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  const isIncoming = pkt.direction === 'incoming';
                  const isError = Boolean(pkt.error);

                  return (
                    <tr
                      key={pkt.id || idx}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-600/20 text-white'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(pkt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3">
                        {isIncoming ? (
                          <span className="flex items-center text-emerald-400 text-[10px]">
                            <ArrowDownLeft className="w-3 h-3 mr-0.5" /> IN
                          </span>
                        ) : (
                          <span className="flex items-center text-purple-400 text-[10px]">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" /> OUT
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 truncate max-w-[120px] font-sans font-medium text-slate-300">
                        {pkt.serverName || 'MCP'}
                      </td>
                      <td className="py-2 px-3 text-cyan-300 font-semibold truncate max-w-[140px]">
                        {pkt.method || 'result'}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {pkt.latencyMs ? `${pkt.latencyMs}ms` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        {isError ? (
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-sans">
                            Error
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-sans">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Packet Deep Inspector (1 column on lg) */}
        <div className="p-4 bg-[#0c101d] overflow-y-auto flex flex-col">
          {selectedPacket ? (
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                    Packet Inspector
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedPacket.method} ({selectedPacket.direction})
                  </span>
                </div>
                <button
                  onClick={() => copyPayload(selectedPacket)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-white/10"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* JSON Payload viewer */}
              <div className="flex-1 bg-slate-950 p-3 rounded-lg border border-white/10 font-mono text-xs overflow-y-auto text-purple-200">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedPacket, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <Code2 className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs">Click any packet row to inspect full JSON-RPC payload, params, and response result.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
