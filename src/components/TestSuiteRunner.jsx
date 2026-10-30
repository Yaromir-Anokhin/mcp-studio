import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  FileCode, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  SlidersHorizontal,
  ChevronRight,
  Terminal
} from 'lucide-react';

const DEFAULT_SUITES = [
  {
    id: 'suite-system-health',
    name: 'Host Health & Specs Smoke Test',
    description: 'Ensures diagnostics, CPU cores and memory telemetry return valid payloads within 500ms.',
    serverId: 'builtin-system',
    scenarios: [
      {
        id: 'sc-1',
        name: 'Get detailed system specs',
        toolName: 'get_system_specs',
        args: { detailed: true },
        maxLatencyMs: 500,
        mustContain: 'cpuCount',
        expectError: false,
        lastResult: null
      },
      {
        id: 'sc-2',
        name: 'Verify memory allocation stats',
        toolName: 'get_memory_usage',
        args: {},
        maxLatencyMs: 300,
        mustContain: 'rssMB',
        expectError: false,
        lastResult: null
      },
      {
        id: 'sc-3',
        name: 'Ping local loopback latency',
        toolName: 'ping_service',
        args: { host: '127.0.0.1' },
        maxLatencyMs: 800,
        mustContain: 'online',
        expectError: false,
        lastResult: null
      }
    ]
  },
  {
    id: 'suite-filesystem-sandbox',
    name: 'Filesystem Safe Sandbox Verification',
    description: 'Verifies directory traversal protections and safe preview boundaries.',
    serverId: 'builtin-filesystem',
    scenarios: [
      {
        id: 'sc-4',
        name: 'List root workspace entries',
        toolName: 'list_directory',
        args: { directoryPath: '.' },
        maxLatencyMs: 400,
        mustContain: 'package.json',
        expectError: false,
        lastResult: null
      },
      {
        id: 'sc-5',
        name: 'Preview head lines of package.json',
        toolName: 'read_file_head',
        args: { filePath: 'package.json', lines: 5 },
        maxLatencyMs: 400,
        mustContain: 'mcp-studio',
        expectError: false,
        lastResult: null
      }
    ]
  }
];

export default function TestSuiteRunner({ servers = [], onCallTool, activeServerId }) {
  const [suites, setSuites] = useState(() => {
    const saved = localStorage.getItem('mcp_test_suites');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_SUITES;
  });

  const [activeSuiteId, setActiveSuiteId] = useState(suites[0]?.id || '');
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [runningScenarioId, setRunningScenarioId] = useState(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [copiedCi, setCopiedCi] = useState(false);

  useEffect(() => {
    localStorage.setItem('mcp_test_suites', JSON.stringify(suites));
  }, [suites]);

  const activeSuite = suites.find(s => s.id === activeSuiteId) || suites[0];

  const runScenario = async (suiteId, scenario) => {
    setRunningScenarioId(scenario.id);
    const start = Date.now();
    let result = {
      passed: false,
      latencyMs: 0,
      output: null,
      error: null,
      failureReason: null
    };

    try {
      // Find server
      const targetServerId = activeSuite?.serverId || activeServerId || servers[0]?.id;
      const res = await onCallTool(targetServerId, scenario.toolName, scenario.args);
      const latencyMs = Date.now() - start;
      result.latencyMs = latencyMs;
      result.output = res;

      if (!res || res.error) {
        if (scenario.expectError) {
          result.passed = true;
        } else {
          result.passed = false;
          result.failureReason = res?.error || 'Tool execution returned error';
        }
      } else {
        const outString = typeof res === 'string' ? res : JSON.stringify(res);
        if (scenario.maxLatencyMs && latencyMs > scenario.maxLatencyMs) {
          result.passed = false;
          result.failureReason = `Latency exceeded threshold (${latencyMs}ms > ${scenario.maxLatencyMs}ms)`;
        } else if (scenario.mustContain && !outString.includes(scenario.mustContain)) {
          result.passed = false;
          result.failureReason = `Response body does not contain expected substring: "${scenario.mustContain}"`;
        } else {
          result.passed = true;
        }
      }
    } catch (err) {
      result.latencyMs = Date.now() - start;
      result.error = err.message;
      if (scenario.expectError) {
        result.passed = true;
      } else {
        result.passed = false;
        result.failureReason = `Exception thrown: ${err.message}`;
      }
    } finally {
      setRunningScenarioId(null);
    }

    setSuites(prev => prev.map(s => {
      if (s.id !== suiteId) return s;
      return {
        ...s,
        scenarios: s.scenarios.map(sc => sc.id === scenario.id ? { ...sc, lastResult: result } : sc)
      };
    }));

    return result;
  };

  const runAllInSuite = async () => {
    if (!activeSuite || isRunningAll) return;
    setIsRunningAll(true);
    for (const sc of activeSuite.scenarios) {
      await runScenario(activeSuite.id, sc);
    }
    setIsRunningAll(false);
  };

  const addScenario = () => {
    if (!activeSuite) return;
    const newSc = {
      id: `sc-${Date.now()}`,
      name: 'New Custom Tool Test',
      toolName: servers[0]?.tools?.[0]?.name || 'ping_service',
      args: {},
      maxLatencyMs: 1000,
      mustContain: '',
      expectError: false,
      lastResult: null
    };

    setSuites(prev => prev.map(s => {
      if (s.id !== activeSuite.id) return s;
      return { ...s, scenarios: [...s.scenarios, newSc] };
    }));
    setSelectedScenarioId(newSc.id);
  };

  const deleteScenario = (scenarioId) => {
    setSuites(prev => prev.map(s => {
      if (s.id !== activeSuite.id) return s;
      return { ...s, scenarios: s.scenarios.filter(sc => sc.id !== scenarioId) };
    }));
    if (selectedScenarioId === scenarioId) setSelectedScenarioId(null);
  };

  const updateScenario = (scenarioId, patch) => {
    setSuites(prev => prev.map(s => {
      if (s.id !== activeSuite.id) return s;
      return {
        ...s,
        scenarios: s.scenarios.map(sc => sc.id === scenarioId ? { ...sc, ...patch } : sc)
      };
    }));
  };

  const exportSuiteJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeSuite, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${activeSuite.name.toLowerCase().replace(/\s+/g, '_')}_suite.json`);
    dlAnchorElem.click();
  };

  const copyCiSnippet = () => {
    const yaml = `name: MCP Studio Automated Server Test
on: [push, pull_request]

jobs:
  test-mcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
`;
    navigator.clipboard.writeText(yaml);
    setCopiedCi(true);
    setTimeout(() => setCopiedCi(false), 2000);
  };

  const selectedScenario = activeSuite?.scenarios.find(s => s.id === selectedScenarioId) || activeSuite?.scenarios[0];

  const passCount = activeSuite?.scenarios.filter(s => s.lastResult?.passed).length || 0;
  const failCount = activeSuite?.scenarios.filter(s => s.lastResult && !s.lastResult.passed).length || 0;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0d18]">
      {/* Left: Suites & Scenarios List */}
      <div className="w-80 border-r border-white/10 bg-[#0c101d] flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Test Collections</h2>
            </div>
            <button
              onClick={exportSuiteJson}
              title="Export Suite JSON"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suites Switcher */}
          <div className="p-2 border-b border-white/5 bg-slate-950/40">
            <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Select Suite:</label>
            <select
              value={activeSuiteId}
              onChange={(e) => setActiveSuiteId(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 px-2 py-1.5 rounded border border-white/10 focus:border-purple-500 focus:outline-none"
            >
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Scenarios List */}
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Scenarios ({activeSuite?.scenarios.length || 0})</span>
              <button
                onClick={addScenario}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {activeSuite?.scenarios.map(sc => {
              const isSelected = selectedScenario?.id === sc.id;
              const isRunning = runningScenarioId === sc.id;
              const hasRun = sc.lastResult !== null && sc.lastResult !== undefined;
              const passed = sc.lastResult?.passed;

              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500/50 text-white'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    {isRunning ? (
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
                    ) : hasRun ? (
                      passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-medium truncate">{sc.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{sc.toolName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-1">
                    {sc.lastResult && (
                      <span className={`text-[10px] font-mono px-1 rounded ${
                        sc.lastResult.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {sc.lastResult.latencyMs}ms
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); runScenario(activeSuite.id, sc); }}
                      disabled={isRunningAll || isRunning}
                      className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                      title="Run test"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suite Stats & Run All */}
        <div className="p-3 border-t border-white/10 bg-slate-950/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400">Scorecard:</span>
            <div className="flex items-center space-x-2 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">{passCount} PASS</span>
              <span className="text-slate-500">/</span>
              <span className="text-red-400 font-bold">{failCount} FAIL</span>
            </div>
          </div>

          <button
            onClick={runAllInSuite}
            disabled={isRunningAll}
            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {isRunningAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Test Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Entire Test Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right: Scenario Assertion Editor & Result Details */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6">
        {selectedScenario ? (
          <div className="space-y-6 max-w-3xl">
            {/* Header info */}
            <div className="bg-[#0f1424] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Scenario Configuration</span>
                <input
                  type="text"
                  value={selectedScenario.name}
                  onChange={(e) => updateScenario(selectedScenario.id, { name: e.target.value })}
                  className="block text-base font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-purple-500 focus:outline-none mt-0.5"
                />
                <p className="text-xs text-slate-400 mt-1">Target Tool: <code className="text-purple-300 font-mono">{selectedScenario.toolName}</code></p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => runScenario(activeSuite.id, selectedScenario)}
                  disabled={runningScenarioId === selectedScenario.id}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-purple-500/20 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute Test</span>
                </button>
                <button
                  onClick={() => deleteScenario(selectedScenario.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                  title="Delete scenario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Assertions Box */}
            <div className="bg-[#0f1424] border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Assertions & Thresholds</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Allowable Latency (ms):</label>
                  <input
                    type="number"
                    value={selectedScenario.maxLatencyMs || 500}
                    onChange={(e) => updateScenario(selectedScenario.id, { maxLatencyMs: Number(e.target.value) })}
                    className="w-full bg-slate-950 font-mono text-slate-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Fails test if round-trip takes longer than this value</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Required Substring / Key:</label>
                  <input
                    type="text"
                    placeholder='e.g. "online" or "cpuCount"'
                    value={selectedScenario.mustContain || ''}
                    onChange={(e) => updateScenario(selectedScenario.id, { mustContain: e.target.value })}
                    className="w-full bg-slate-950 font-mono text-slate-200 px-3 py-2 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Response payload must include this text</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Arguments Payload (JSON):</label>
                <textarea
                  rows={3}
                  value={JSON.stringify(selectedScenario.args || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      updateScenario(selectedScenario.id, { args: parsed });
                    } catch {}
                  }}
                  className="w-full bg-slate-950 font-mono text-[11px] text-purple-200 p-2.5 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Execution Result Log */}
            {selectedScenario.lastResult && (
              <div className={`border rounded-xl p-4 space-y-2 ${
                selectedScenario.lastResult.passed
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/20 border-red-500/40 text-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedScenario.lastResult.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-bold text-sm">
                      {selectedScenario.lastResult.passed ? 'ASSERTION PASSED' : 'ASSERTION FAILED'}
                    </span>
                  </div>
                  <span className="text-xs font-mono bg-black/40 px-2 py-0.5 rounded">
                    {selectedScenario.lastResult.latencyMs} ms
                  </span>
                </div>

                {selectedScenario.lastResult.failureReason && (
                  <p className="text-xs text-red-300 font-medium">
                    Reason: {selectedScenario.lastResult.failureReason}
                  </p>
                )}

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Response Payload:</span>
                  <pre className="mt-1 bg-black/60 p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-white/5">
                    {JSON.stringify(selectedScenario.lastResult.output, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* CI/CD Integration Callout */}
            <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Run in CI/CD (GitHub Actions)</h4>
                <p className="text-[11px] text-slate-400">Automate this test suite on every pull request & commit.</p>
              </div>
              <button
                onClick={copyCiSnippet}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                <span>{copiedCi ? 'Copied Workflow!' : 'Copy Workflow YAML'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Select or create a scenario on the left to view assertions.
          </div>
        )}
      </div>
    </div>
  );
}
