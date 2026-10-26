import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Telemetry & Status
  async getStatus() {
    const res = await axios.get(`${API_BASE}/status`);
    return res.data;
  },

  // Servers
  async getServers() {
    const res = await axios.get(`${API_BASE}/servers`);
    return res.data;
  },

  async addServer(payload) {
    const res = await axios.post(`${API_BASE}/servers`, payload);
    return res.data;
  },

  async deleteServer(id) {
    const res = await axios.delete(`${API_BASE}/servers/${id}`);
    return res.data;
  },

  async startServer(id) {
    const res = await axios.post(`${API_BASE}/servers/${id}/start`);
    return res.data;
  },

  async stopServer(id) {
    const res = await axios.post(`${API_BASE}/servers/${id}/stop`);
    return res.data;
  },

  // Tools
  async getTools(serverId) {
    const res = await axios.get(`${API_BASE}/servers/${serverId}/tools`);
    return res.data;
  },

  async callTool(serverId, toolName, args) {
    const res = await axios.post(`${API_BASE}/servers/${serverId}/tools/call`, {
      toolName,
      arguments: args
    });
    return res.data;
  },

  // Resources & Prompts
  async getResources(serverId) {
    const res = await axios.get(`${API_BASE}/servers/${serverId}/resources`);
    return res.data;
  },

  async getPrompts(serverId) {
    const res = await axios.get(`${API_BASE}/servers/${serverId}/prompts`);
    return res.data;
  },

  // Logs
  async getLogs(serverId) {
    const res = await axios.get(`${API_BASE}/servers/${serverId}/logs`);
    return res.data;
  },

  // Traffic
  async getTraffic() {
    const res = await axios.get(`${API_BASE}/traffic`);
    return res.data;
  },

  async clearTraffic() {
    const res = await axios.delete(`${API_BASE}/traffic`);
    return res.data;
  },

  // Marketplace
  async getMarketplace() {
    const res = await axios.get(`${API_BASE}/marketplace`);
    return res.data;
  },

  async installMarketplace(id, customEnv) {
    const res = await axios.post(`${API_BASE}/marketplace/install`, { id, customEnv });
    return res.data;
  },

  // Config Sync
  async detectConfigs() {
    const res = await axios.get(`${API_BASE}/config/detect`);
    return res.data;
  },

  async readConfig(target) {
    const res = await axios.get(`${API_BASE}/config/read`, { params: { target } });
    return res.data;
  },

  async syncConfig(target, serverIds) {
    const res = await axios.post(`${API_BASE}/config/sync`, { target, serverIds });
    return res.data;
  },

  // AI Agent Simulation
  async runAgentChat({ prompt, apiKey, model, provider }) {
    const res = await axios.post(`${API_BASE}/agent/chat`, {
      prompt,
      apiKey,
      model,
      provider
    });
    return res.data;
  }
};
