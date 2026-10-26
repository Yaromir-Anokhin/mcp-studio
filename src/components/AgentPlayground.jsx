import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Settings2,
  Terminal,
  Play
} from 'lucide-react';

export default function AgentPlayground({ onRunAgent, runningServers = [] }) {
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      content: 'Welcome to the **MCP AI Agent Playground**! You can prompt me in natural language. I will automatically analyze your running MCP tools, plan execution steps, call the appropriate tools, and synthesize the results.'
    }
  ]);
  const [modelProvider, setModelProvider] = useState('mock'); // 'mock' | 'openai'
  const [apiKey, setApiKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const presets = [
    { label: 'Check Host Memory & Specs', prompt: 'Check the host free memory, total RAM, and system hardware specs.' },
    { label: 'Explore Files in Workspace', prompt: 'List all files and subdirectories located inside the workspace.' },
    { label: 'Search MCP Architecture Docs', prompt: 'Search knowledge base for Model Context Protocol specification details.' },
    { label: 'Ping Connectivity Test', prompt: 'Test network connectivity and ping latency to 1.1.1.1' }
  ];

  const handleSend = async (userPrompt = prompt) => {
    if (!userPrompt.trim() || isExecuting) return;

    const userMessage = { role: 'user', content: userPrompt };
    setConversation(prev => [...prev, userMessage]);
    setPrompt('');
    setIsExecuting(true);

    try {
      const res = await onRunAgent({
        prompt: userPrompt,
        apiKey: apiKey.trim() || undefined,
        provider: modelProvider,
        model: modelProvider === 'openai' ? 'gpt-4o-mini' : 'simulated'
      });

      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          steps: res.steps,
          durationMs: res.durationMs
        }
      ]);
    } catch (err) {
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          error: true,
          content: `Failed to execute agent loop: ${err.message}`
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c101d] overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/10 bg-[#0f1424] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">AI Agent Tool Calling Simulator</h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                {modelProvider === 'mock' ? 'Zero-Config Simulated' : 'OpenAI API'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Test end-to-end multi-step tool execution with live MCP servers
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-white/10 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Model Settings</span>
        </button>
      </div>

      {/* Model Config Drawer */}
      {showConfig && (
        <div className="p-4 bg-slate-900/90 border-b border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Execution Engine:</label>
            <select
              value={modelProvider}
              onChange={(e) => setModelProvider(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-md border border-white/10 focus:outline-none focus:border-purple-500"
            >
              <option value="mock">Simulated Heuristic Agent (Zero API Key required)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
            </select>
          </div>
          {modelProvider === 'openai' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">OpenAI API Key:</label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 font-mono text-slate-200 px-3 py-2 rounded-md border border-white/10 focus:outline-none focus:border-purple-500 placeholder-slate-400"
              />
            </div>
          )}
        </div>
      )}

      {/* Chat & Execution Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-3xl rounded-xl p-4 border text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-purple-600/30 border-purple-500/40 text-white rounded-br-none'
                : msg.error
                ? 'bg-red-500/10 border-red-500/30 text-red-200'
                : 'bg-slate-900/90 border-white/10 text-slate-200 rounded-bl-none'
            }`}>
              {/* Message Header */}
              <div className="flex items-center space-x-2 mb-2 pb-1 border-b border-white/5">
                <span className="font-semibold capitalize text-slate-300 flex items-center space-x-1">
                  {msg.role === 'user' ? 'You' : 'MCP Agent Assistant'}
                </span>
                {msg.durationMs && (
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono flex items-center space-x-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{msg.durationMs}ms</span>
                  </span>
                )}
              </div>

              {/* Execution Steps Trace */}
              {msg.steps && msg.steps.length > 0 && (
                <div className="my-3 space-y-2 bg-slate-950/80 p-3 rounded-lg border border-white/5">
                  <div className="text-[11px] font-semibold text-purple-300 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Autonomous Tool Execution Trace:</span>
                  </div>
                  {msg.steps.map((st, sidx) => (
                    <div key={sidx} className="text-[11px] font-mono pl-2 border-l-2 border-purple-500/40 space-y-1">
                      {st.type === 'reasoning' && (
                        <p className="text-slate-400 italic">💭 {st.thought}</p>
                      )}
                      {st.type === 'tool_call' && (
                        <p className="text-cyan-300">
                          🛠️ Calling <strong className="text-white">{st.tool}</strong> on {st.server} with args: {JSON.stringify(st.arguments)}
                        </p>
                      )}
                      {st.type === 'tool_result' && (
                        <p className="text-emerald-400 truncate max-w-full">
                          ✓ Result received ({st.output?.length || 0} bytes)
                        </p>
                      )}
                      {st.type === 'tool_error' && (
                        <p className="text-red-400">✗ Tool error: {st.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center space-x-2 text-xs text-purple-300 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20 w-fit animate-pulse">
            <Cpu className="w-4 h-4 animate-spin" />
            <span>Agent is planning & querying active MCP tools...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Presets */}
      <div className="px-4 py-2 bg-[#090c15] border-t border-white/5 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0">Try Prompts:</span>
        {presets.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.prompt)}
            disabled={isExecuting}
            className="text-[11px] bg-slate-900 hover:bg-purple-600/20 text-slate-300 hover:text-purple-200 px-2.5 py-1 rounded-md border border-white/10 hover:border-purple-500/40 whitespace-nowrap transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-white/10 bg-[#0f1424]">
        <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-white/10 focus-within:border-purple-500 transition-colors">
          <input
            type="text"
            placeholder="Ask the AI agent to run tasks using available MCP tools..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={isExecuting}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-400 px-2 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={isExecuting || !prompt.trim()}
            className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md shadow-purple-500/20"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
