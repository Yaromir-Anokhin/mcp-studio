import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Search, 
  Clock, 
  Copy, 
  Check, 
  Code2, 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Terminal, 
  AlertTriangle,
  History,
  FileJson,
  Layers,
  CheckSquare
} from 'lucide-react';

export default function ToolRunner({
  server,
  onCallTool,
  isLoading,
  onSaveToSuite
}) {
  const tools = server?.tools || [];
  const [selectedToolName, setSelectedToolName] = useState(tools[0]?.name || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [mode, setMode] = useState('form'); // 'form' | 'json'
  const [formValues, setFormValues] = useState({});
  const [jsonText, setJsonText] = useState('{}');
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  // Auto-select first tool when server changes
  useEffect(() => {
    if (tools.length > 0) {
      const exists = tools.find(t => t.name === selectedToolName);
      if (!exists) {
        setSelectedToolName(tools[0].name);
      }
    } else {
      setSelectedToolName('');
    }
    setResponse(null);
  }, [server, tools]);

  const currentTool = tools.find(t => t.name === selectedToolName);

  // Initialize form fields when tool changes
  useEffect(() => {
    if (!currentTool) return;
    const initial = {};
    const schema = currentTool.inputSchema?.properties || {};
    for (const [key, prop] of Object.entries(schema)) {
      if (prop.default !== undefined) {
        initial[key] = prop.default;
      } else if (prop.type === 'boolean') {
        initial[key] = false;
      } else if (prop.type === 'number') {
        initial[key] = 0;
      } else {
        initial[key] = '';
      }
    }
    setFormValues(initial);
    setJsonText(JSON.stringify(initial, null, 2));
  }, [selectedToolName]);

  const handleFieldChange = (key, val, type) => {
    let parsedVal = val;
    if (type === 'number') {
      parsedVal = Number(val);
    } else if (type === 'boolean') {
      parsedVal = Boolean(val);
    }
    const updated = { ...formValues, [key]: parsedVal };
    setFormValues(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setFormValues(parsed);
    } catch {}
  };

  const handleExecute = async () => {
    if (!currentTool || isLoading) return;
    let args = formValues;
    if (mode === 'json') {
      try {
        args = JSON.parse(jsonText);
      } catch (e) {
        setResponse({ error: `Invalid JSON syntax: ${e.message}`, success: false });
        return;
      }
    }

    const res = await onCallTool(server.id, currentTool.name, args);
    setResponse(res);

    if (res) {
      setHistory(prev => [
        {
          id: Date.now(),
          toolName: currentTool.name,
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: res.latencyMs,
          success: res.success !== false,
          args
        },
        ...prev.slice(0, 19)
      ]);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left List of Tools */}
      <div className="w-72 border-r border-white/10 bg-[#090c15] flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tools..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-md border border-white/10 focus:outline-none focus:border-purple-500 placeholder-slate-400"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <span>Available Tools ({filteredTools.length})</span>
            <span className="text-[10px] text-purple-400 font-mono">tools/call</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {filteredTools.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              {server?.status !== 'running' 
                ? 'Server is stopped. Click Start in sidebar.'
                : 'No tools discovered for this server.'}
            </div>
          ) : (
            filteredTools.map((t) => {
              const isSelected = t.name === selectedToolName;
              const reqCount = t.inputSchema?.required?.length || 0;
              return (
                <button
                  key={t.name}
                  onClick={() => setSelectedToolName(t.name)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500/50 text-white shadow-sm'
                      : 'border-transparent hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold font-mono text-[12px] text-purple-300 truncate">
                      {t.name}
                    </span>
                    {reqCount > 0 && (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1 rounded">
                        {reqCount} req
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description || 'No description provided.'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Request & Response Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c101d]">
        {currentTool ? (
          <>
            {/* Header / Action Bar */}
            <div className="p-4 border-b border-white/10 bg-[#0f1424] flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-base font-bold text-white">
                    {currentTool.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    tools/call
                  </span>
                  <span className="text-[11px] text-slate-400">
                    from <strong className="text-slate-300">{server?.name}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentTool.description}
                </p>
              </div>

              {/* Mode Toggles & Run Button */}
              <div className="flex items-center space-x-2.5">
                <div className="bg-slate-900 p-0.5 rounded-lg border border-white/10 flex text-xs">
                  <button
                    onClick={() => setMode('form')}
                    className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1 ${
                      mode === 'form' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Form</span>
                  </button>
                  <button
                    onClick={() => setMode('json')}
                    className={`px-3 py-1 rounded-md transition-all flex items-center space-x-1 ${
                      mode === 'json' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Raw JSON</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    let args = formValues;
                    if (mode === 'json') {
                      try { args = JSON.parse(jsonText); } catch {}
                    }
                    if (onSaveToSuite && currentTool) {
                      onSaveToSuite({
                        id: `sc-${Date.now()}`,
                        name: `Test: ${currentTool.name} (${new Date().toLocaleTimeString()})`,
                        toolName: currentTool.name,
                        args,
                        maxLatencyMs: 800,
                        mustContain: '',
                        expectError: false,
                        lastResult: null
                      });
                    }
                  }}
                  title="Save request to Test Suite"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-white/10 transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Save as Test</span>
                </button>

                <button
                  onClick={handleExecute}
                  disabled={isLoading || server?.status !== 'running'}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-md ${
                    server?.status !== 'running'
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : isLoading
                      ? 'bg-purple-700 text-white animate-pulse'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 active:scale-95'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : 'fill-white'}`} />
                  <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
                  <span className="text-[10px] opacity-75 font-mono ml-1 hidden sm:inline">Ctrl+↵</span>
                </button>
              </div>
            </div>

            {/* Split Pane: Request Parameters (Top/Left) & Response (Bottom/Right) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
              {/* Parameters Panel */}
              <div className="p-4 border-r border-white/10 overflow-y-auto bg-[#0b0e19]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileJson className="w-3.5 h-3.5 text-purple-400" />
                    <span>Input Parameters</span>
                  </h3>
                  <button
                    onClick={() => {
                      setFormValues({});
                      setJsonText('{}');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {mode === 'form' ? (
                  <div className="space-y-3.5">
                    {Object.keys(currentTool.inputSchema?.properties || {}).length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-white/10 rounded-lg text-xs text-slate-400">
                        This tool does not require any parameters. You can click <strong>Send Request</strong> directly.
                      </div>
                    ) : (
                      Object.entries(currentTool.inputSchema.properties).map(([key, prop]) => {
                        const isRequired = currentTool.inputSchema?.required?.includes(key);
                        const val = formValues[key] !== undefined ? formValues[key] : '';

                        return (
                          <div key={key} className="p-3 rounded-lg bg-slate-900/70 border border-white/5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-mono font-medium text-slate-200 flex items-center space-x-1">
                                <span>{key}</span>
                                {isRequired && <span className="text-red-400 text-xs">*</span>}
                              </label>
                              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                {prop.type}
                              </span>
                            </div>

                            {prop.description && (
                              <p className="text-[11px] text-slate-400">
                                {prop.description}
                              </p>
                            )}

                            {/* Render input based on type */}
                            {prop.type === 'boolean' ? (
                              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(val)}
                                  onChange={(e) => handleFieldChange(key, e.target.checked, 'boolean')}
                                  className="w-4 h-4 rounded bg-slate-800 border-white/20 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-xs text-slate-300 font-mono">
                                  {val ? 'true' : 'false'}
                                </span>
                              </label>
                            ) : prop.enum ? (
                              <select
                                value={val}
                                onChange={(e) => handleFieldChange(key, e.target.value, 'string')}
                                className="w-full bg-slate-950 text-xs text-slate-200 px-3 py-2 rounded-md border border-white/10 focus:border-purple-500 focus:outline-none"
                              >
                                {prop.enum.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={prop.type === 'number' ? 'number' : 'text'}
                                value={val}
                                placeholder={prop.default ? `Default: ${prop.default}` : `Enter ${key}...`}
                                onChange={(e) => handleFieldChange(key, e.target.value, prop.type)}
                                className="w-full bg-slate-950 text-xs font-mono text-slate-200 px-3 py-2 rounded-md border border-white/10 focus:border-purple-500 focus:outline-none placeholder-slate-400"
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="h-[calc(100%-2rem)]">
                    <textarea
                      value={jsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      className="w-full h-full min-h-[300px] bg-slate-950 font-mono text-xs text-purple-200 p-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none leading-relaxed resize-none"
                      placeholder="{}"
                    />
                  </div>
                )}
              </div>

              {/* Response Panel */}
              <div className="p-4 flex flex-col h-full bg-[#0c101d] overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Response Payload
                    </h3>
                    {response && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        response.success !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {response.success !== false ? '200 OK' : 'RPC Error'}
                      </span>
                    )}
                    {response?.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{response.latencyMs} ms</span>
                      </span>
                    )}
                  </div>

                  {response && (
                    <button
                      onClick={() => copyToClipboard(response)}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 border border-white/5"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-slate-950 rounded-lg border border-white/10 p-3 overflow-y-auto font-mono text-xs">
                  {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs">Dispatching JSON-RPC 2.0 to MCP Server...</p>
                    </div>
                  ) : response ? (
                    <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
                      <Terminal className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs">No response yet.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Configure your arguments and click <strong>Send Request</strong> to execute.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
            <Layers className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">Select a Tool to Inspect</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Choose an MCP tool from the left panel to generate interactive input forms, inspect JSON schemas, and test execution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
