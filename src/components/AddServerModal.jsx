import React, { useState } from 'react';
import { X, Plus, Terminal, Settings, Layers, Play } from 'lucide-react';
import { api } from '../services/api';

export default function AddServerModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [command, setCommand] = useState('npx');
  const [argsText, setArgsText] = useState('-y @modelcontextprotocol/server-filesystem .');
  const [envJson, setEnvJson] = useState('{}');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let parsedEnv = {};
    try {
      parsedEnv = JSON.parse(envJson || '{}');
    } catch {
      alert('Invalid JSON in Environment Variables field');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.addServer({
        name: name || 'Custom MCP Server',
        command: command.trim(),
        args: argsText.trim().split(' ').filter(Boolean),
        env: parsedEnv,
        description
      });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      alert(`Failed to add server: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (tplName, tplCmd, tplArgs) => {
    setName(tplName);
    setCommand(tplCmd);
    setArgsText(tplArgs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1424] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Add Custom MCP Server</h2>
              <p className="text-xs text-slate-400">Launch any local CLI process via stdio JSON-RPC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates */}
        <div className="px-6 pt-4 pb-2 border-b border-white/5 bg-[#090c15] flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-semibold uppercase text-[10px] shrink-0">Presets:</span>
          <button
            type="button"
            onClick={() => applyTemplate('Local Filesystem MCP', 'npx', '-y @modelcontextprotocol/server-filesystem .')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors whitespace-nowrap"
          >
            Filesystem (npx)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('Python FastMCP Server', 'uv', 'run server.py')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors whitespace-nowrap"
          >
            Python (uv run)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('Node Custom Server', 'node', './mcp-server.js')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors whitespace-nowrap"
          >
            Node.js
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Server Display Name:</label>
            <input
              type="text"
              placeholder="e.g. My Custom Tools MCP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-slate-300 font-medium mb-1">Command:</label>
              <input
                type="text"
                placeholder="npx / uv / node"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full bg-slate-950 font-mono text-slate-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Arguments:</label>
              <input
                type="text"
                placeholder="args separated by spaces..."
                value={argsText}
                onChange={(e) => setArgsText(e.target.value)}
                className="w-full bg-slate-950 font-mono text-slate-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Environment Variables (JSON):</label>
            <textarea
              rows={3}
              value={envJson}
              onChange={(e) => setEnvJson(e.target.value)}
              placeholder='{ "API_KEY": "secret" }'
              className="w-full bg-slate-950 font-mono text-[11px] text-purple-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description (Optional):</label>
            <input
              type="text"
              placeholder="Short note about this MCP server..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20 transition-all"
            >
              {isSubmitting ? 'Adding...' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
