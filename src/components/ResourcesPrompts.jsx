import React, { useState } from 'react';
import { 
  FolderTree, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  Search,
  BookOpen,
  Terminal
} from 'lucide-react';

export default function ResourcesPrompts({ server }) {
  const [activeSubTab, setActiveSubTab] = useState('resources'); // 'resources' | 'prompts'
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);

  const resources = server?.resources || [];
  const prompts = server?.prompts || [];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c101d] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-[#0f1424] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Resources & Prompt Templates</h2>
            <p className="text-xs text-slate-400">
              Inspect contextual URIs, file schemas, and prompt templates on <strong>{server?.name}</strong>
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="bg-slate-900 p-0.5 rounded-lg border border-white/10 flex text-xs">
          <button
            onClick={() => { setActiveSubTab('resources'); setSelectedItem(null); }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'resources' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resources ({resources.length})</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('prompts'); setSelectedItem(null); }}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'prompts' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompts ({prompts.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left List */}
        <div className="p-4 border-r border-white/10 overflow-y-auto bg-[#090c15] space-y-2">
          {activeSubTab === 'resources' ? (
            resources.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-lg">
                No dynamic resources declared by this MCP server.
              </div>
            ) : (
              resources.map((res, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedItem(res)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedItem?.uri === res.uri
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-sm'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-cyan-300 font-mono text-[11px] truncate">
                      {res.uri}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      {res.mimeType || 'text/plain'}
                    </span>
                  </div>
                  <p className="text-slate-200 font-medium text-xs">{res.name}</p>
                  <p className="text-slate-400 text-[11px] mt-1">{res.description}</p>
                </div>
              ))
            )
          ) : (
            prompts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-lg">
                No prompt templates registered by this MCP server.
              </div>
            ) : (
              prompts.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedItem(p)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedItem?.name === p.name
                      ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-sm'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-purple-300 font-mono text-xs">
                      {p.name}
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                      {p.arguments?.length || 0} args
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{p.description}</p>
                </div>
              ))
            )
          )}
        </div>

        {/* Right Detail Preview */}
        <div className="p-4 bg-[#0c101d] overflow-y-auto">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-sm text-white font-mono">
                    {selectedItem.uri || selectedItem.name}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {activeSubTab === 'resources' ? 'MCP Resource' : 'MCP Prompt Template'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedItem)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-white/10"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-white/10 font-mono text-xs text-slate-200">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(selectedItem, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <BookOpen className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs">Select an item from the left list to view detailed payload and arguments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
