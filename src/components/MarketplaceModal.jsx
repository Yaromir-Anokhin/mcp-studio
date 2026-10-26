import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Search, 
  Download, 
  Check, 
  Star, 
  ExternalLink, 
  Key, 
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function MarketplaceModal({ isOpen, onClose, onInstalled }) {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [configuringItem, setConfiguringItem] = useState(null);
  const [customEnv, setCustomEnv] = useState({});
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedId, setInstalledId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getMarketplace().then(setItems).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', 'Developer Tools', 'Databases', 'Search & Web', 'Local & System', 'Productivity'];

  const filteredItems = items.filter(it => {
    const matchesCat = selectedCategory === 'All' || it.category === selectedCategory;
    const matchesSearch = 
      it.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      it.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      it.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleStartInstall = (item) => {
    // If has required env variables, open config view
    if (item.env && Object.keys(item.env).length > 0) {
      setConfiguringItem(item);
      setCustomEnv({ ...item.env });
    } else {
      executeInstall(item.id, {});
    }
  };

  const executeInstall = async (id, env) => {
    setIsInstalling(true);
    try {
      await api.installMarketplace(id, env);
      setInstalledId(id);
      setConfiguringItem(null);
      if (onInstalled) onInstalled();
      setTimeout(() => setInstalledId(null), 3000);
    } catch (e) {
      alert(`Install failed: ${e.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1424] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white">MCP Server Marketplace & Registry</h2>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                  Official & Community
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1-click install pre-configured MCP servers into your local environment
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

        {/* Filters & Search */}
        <div className="p-4 border-b border-white/10 bg-[#090c15] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search servers..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-purple-500 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Content: Cards Grid or Env Configuration View */}
        <div className="p-6 overflow-y-auto flex-1">
          {configuringItem ? (
            <div className="max-w-lg mx-auto bg-slate-900/80 p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>Configure {configuringItem.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Provide required tokens or environment variables.</p>
                </div>
                <button
                  onClick={() => setConfiguringItem(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                {Object.keys(configuringItem.env).map(envKey => (
                  <div key={envKey}>
                    <label className="block text-xs font-mono text-slate-300 mb-1">{envKey}</label>
                    <input
                      type="password"
                      placeholder={`Enter ${envKey}...`}
                      value={customEnv[envKey] || ''}
                      onChange={(e) => setCustomEnv({ ...customEnv, [envKey]: e.target.value })}
                      className="w-full bg-slate-950 text-xs font-mono text-slate-200 px-3 py-2 rounded-md border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => executeInstall(configuringItem.id, customEnv)}
                disabled={isInstalling}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold text-xs shadow-md transition-all"
              >
                {isInstalling ? 'Installing...' : 'Confirm & Add Server'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const isJustInstalled = installedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-purple-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <div className="flex items-center space-x-1 text-amber-400 text-[11px] font-mono">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{(item.stars / 1000).toFixed(1)}k</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.tags?.map(t => (
                          <span key={t} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <a
                        href={item.github}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <span>Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleStartInstall(item)}
                        disabled={isInstalling || isJustInstalled}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                          isJustInstalled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500'
                        }`}
                      >
                        {isJustInstalled ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Installed</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>1-Click Install</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
