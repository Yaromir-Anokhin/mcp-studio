import React, { useState, useEffect } from 'react';
import { 
  X, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileCode, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function ConfigSyncModal({ isOpen, onClose, servers = [] }) {
  const [detectedPaths, setDetectedPaths] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState('claude'); // 'claude' | 'cursor'
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.detectConfigs().then(setDetectedPaths).catch(console.error);
      setSyncStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build preview JSON
  const previewMap = {};
  for (const s of servers) {
    if (s.type === 'stdio') {
      const key = s.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      previewMap[key] = {
        command: s.command,
        args: s.args,
        env: s.env || {}
      };
    }
  }

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncConfig(selectedTarget);
      setSyncStatus({ success: true, message: `Successfully synchronized ${res.serverCount} servers! Backup automatically saved.` });
    } catch (err) {
      setSyncStatus({ success: false, message: `Sync failed: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const targetInfo = detectedPaths ? detectedPaths[selectedTarget] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1424] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">1-Click Config Sync</h2>
              <p className="text-xs text-slate-400">
                Export and sync MCP servers directly into Claude Desktop or Cursor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Target Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Select Target Application:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedTarget('claude')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTarget === 'claude'
                    ? 'bg-purple-600/20 border-purple-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Claude Desktop</span>
                  {detectedPaths?.claude?.exists ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Detected</span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Will create</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  claude_desktop_config.json
                </p>
              </button>

              <button
                onClick={() => setSelectedTarget('cursor')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTarget === 'cursor'
                    ? 'bg-purple-600/20 border-purple-500/50 shadow-sm'
                    : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">Cursor Editor</span>
                  {detectedPaths?.cursor?.exists ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Detected</span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Will create</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  ~/.cursor/mcp.json
                </p>
              </button>
            </div>
          </div>

          {/* Path Info */}
          {targetInfo && (
            <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1 font-mono text-[11px]">
              <div className="text-slate-400">Target Config File Path:</div>
              <div className="text-cyan-300 break-all">{targetInfo.path}</div>
            </div>
          )}

          {/* Configuration Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Generated `mcpServers` JSON:</span>
              <span className="text-[11px] text-purple-400 font-mono">
                {Object.keys(previewMap).length} servers to export
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-white/10 font-mono text-xs max-h-48 overflow-y-auto text-purple-200">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify({ mcpServers: previewMap }, null, 2)}
              </pre>
            </div>
          </div>

          {/* Safe Backup Guarantee */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Zero data loss guarantee: MCP Studio creates an automatic timestamped backup before modifying your config.
            </span>
          </div>

          {/* Status Alert */}
          {syncStatus && (
            <div className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
              syncStatus.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {syncStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{syncStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing || Object.keys(previewMap).length === 0}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all active:scale-95"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>{isSyncing ? 'Syncing...' : `Sync to ${selectedTarget === 'claude' ? 'Claude' : 'Cursor'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
