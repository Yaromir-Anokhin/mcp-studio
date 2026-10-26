import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ToolRunner from './components/ToolRunner';
import AgentPlayground from './components/AgentPlayground';
import ResourcesPrompts from './components/ResourcesPrompts';
import NetworkInspector from './components/NetworkInspector';
import ConsoleLogs from './components/ConsoleLogs';
import ConfigSyncModal from './components/ConfigSyncModal';
import MarketplaceModal from './components/MarketplaceModal';
import AddServerModal from './components/AddServerModal';
import SponsorsModal from './components/SponsorsModal';
import { api } from './services/api';

export default function App() {
  const [servers, setServers] = useState([]);
  const [activeServerId, setActiveServerId] = useState('');
  const [activeTab, setActiveTab] = useState('tools'); // 'tools' | 'agent' | 'resources' | 'network' | 'sync' | 'marketplace' | 'logs'
  const [traffic, setTraffic] = useState([]);
  const [logs, setLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [isCallingTool, setIsCallingTool] = useState(false);

  // Modals state
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [isSponsorsOpen, setIsSponsorsOpen] = useState(false);

  const wsRef = useRef(null);

  // Load initial data
  const loadData = async () => {
    try {
      const srvList = await api.getServers();
      setServers(srvList);
      if (srvList.length > 0 && !activeServerId) {
        // default to first running or first server
        const running = srvList.find(s => s.status === 'running');
        setActiveServerId(running ? running.id : srvList[0].id);
      }
      const trafficList = await api.getTraffic();
      setTraffic(trafficList);
    } catch (e) {
      console.error('Failed to load initial servers:', e);
    }
  };

  useEffect(() => {
    loadData();

    // WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TRAFFIC_UPDATE') {
          setTraffic(prev => [msg.payload, ...prev.slice(0, 499)]);
        } else if (msg.type === 'SERVER_STATUS_CHANGED') {
          setServers(prev => prev.map(s => s.id === msg.payload.id ? { ...s, ...msg.payload.server, status: msg.payload.status } : s));
        } else if (msg.type === 'LOG_ENTRY') {
          if (msg.payload.serverId === activeServerId) {
            setLogs(prev => [...prev.slice(-199), msg.payload.entry]);
          }
        }
      } catch (err) {
        console.error('WS Parse Error:', err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // When activeServerId changes, fetch its logs
  useEffect(() => {
    if (activeServerId) {
      api.getLogs(activeServerId).then(setLogs).catch(console.error);
    }
  }, [activeServerId]);

  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];

  // Actions
  const handleStartServer = async (id) => {
    try {
      await api.startServer(id);
      await loadData();
    } catch (err) {
      alert(`Start failed: ${err.message}`);
    }
  };

  const handleStopServer = async (id) => {
    try {
      await api.stopServer(id);
      await loadData();
    } catch (err) {
      alert(`Stop failed: ${err.message}`);
    }
  };

  const handleDeleteServer = async (id) => {
    if (!window.confirm('Delete this MCP server from configuration?')) return;
    try {
      await api.deleteServer(id);
      await loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCallTool = async (serverId, toolName, args) => {
    setIsCallingTool(true);
    try {
      const res = await api.callTool(serverId, toolName, args);
      return res;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || err.message
      };
    } finally {
      setIsCallingTool(false);
    }
  };

  const handleClearTraffic = async () => {
    try {
      await api.clearTraffic();
      setTraffic([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAgent = async (params) => {
    return await api.runAgentChat(params);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090c15] text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        servers={servers}
        activeServerId={activeServerId}
        onSelectServer={setActiveServerId}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenMarketplace={() => setIsMarketplaceOpen(true)}
        onOpenSponsors={() => setIsSponsorsOpen(true)}
        wsConnected={wsConnected}
        onRefresh={loadData}
      />

      {/* Main Container with Sidebar + Active View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'sync') {
              setIsSyncOpen(true);
            } else if (tab === 'marketplace') {
              setIsMarketplaceOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={setActiveServerId}
          onStartServer={handleStartServer}
          onStopServer={handleStopServer}
          onDeleteServer={handleDeleteServer}
          onOpenAddServer={() => setIsAddServerOpen(true)}
          trafficCount={traffic.length}
        />

        {/* Center Dynamic Workspace View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'tools' && (
            <ToolRunner
              server={activeServer}
              onCallTool={handleCallTool}
              isLoading={isCallingTool}
            />
          )}

          {activeTab === 'agent' && (
            <AgentPlayground
              onRunAgent={handleRunAgent}
              runningServers={servers.filter(s => s.status === 'running')}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesPrompts
              server={activeServer}
            />
          )}

          {activeTab === 'network' && (
            <NetworkInspector
              traffic={traffic}
              onClearTraffic={handleClearTraffic}
            />
          )}

          {activeTab === 'logs' && (
            <ConsoleLogs
              logs={logs}
              serverName={activeServer?.name}
              onClear={() => setLogs([])}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ConfigSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        servers={servers}
      />

      <MarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onInstalled={loadData}
      />

      <AddServerModal
        isOpen={isAddServerOpen}
        onClose={() => setIsAddServerOpen(false)}
        onCreated={loadData}
      />

      <SponsorsModal
        isOpen={isSponsorsOpen}
        onClose={() => setIsSponsorsOpen(false)}
      />
    </div>
  );
}
