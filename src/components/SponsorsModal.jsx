import React from 'react';
import { 
  X, 
  Heart, 
  Sparkles, 
  Check, 
  Github, 
  Coffee, 
  CreditCard, 
  ExternalLink,
  ShieldAlert,
  Zap
} from 'lucide-react';

export default function SponsorsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tiers = [
    {
      name: 'Coffee Supporter',
      price: '$5',
      period: '/ month',
      badge: 'Backer',
      color: 'border-white/10 hover:border-purple-500/40',
      btnColor: 'bg-slate-800 hover:bg-slate-700 text-white',
      perks: [
        'GitHub Sponsor badge on your profile',
        'Your name/handle listed in README.md Backers',
        'Access to private Discord dev channel'
      ]
    },
    {
      name: 'Pro Developer',
      price: '$15',
      period: '/ month',
      popular: true,
      badge: 'Popular',
      color: 'border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-500/10',
      btnColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500',
      perks: [
        'Everything in Coffee Supporter',
        'Early access to native Tauri v2 desktop binaries',
        'Access to community MCP custom servers registry',
        'Priority feature requests on GitHub roadmap'
      ]
    },
    {
      name: 'Company / Startup',
      price: '$50',
      period: '/ month',
      badge: 'Sponsor',
      color: 'border-cyan-500/40 hover:border-cyan-500/70',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      perks: [
        'Company logo with link on README.md (5k+ stars)',
        'Logo featured inside MCP Studio desktop client',
        'Direct Discord technical consulting channel'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1424] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-md shadow-pink-500/10">
              <Heart className="w-6 h-6 fill-pink-500/30" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Sponsor MCP Studio Development</h2>
                <span className="text-[10px] font-semibold bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                  Open Source & Independent
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Help us build the ultimate open-source DevTools for the Model Context Protocol ecosystem.
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

        {/* Tiers Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${t.color}`}
            >
              {t.popular && (
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                  MOST POPULAR
                </div>
              )}

              <div>
                <span className="text-xs font-semibold text-slate-300">{t.name}</span>
                <div className="mt-2 flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-white">{t.price}</span>
                  <span className="text-xs text-slate-400">{t.period}</span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-slate-300">
                  {t.perks.map((p, pidx) => (
                    <div key={pidx} className="flex items-start space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight text-slate-300">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <a
                  href="https://github.com/sponsors/Yaromir-Anokhin"
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all ${t.btnColor}`}
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>Sponsor on GitHub</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Payment Links */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <span>Alternative donation methods:</span>
          <div className="flex items-center space-x-3">
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-300 flex items-center space-x-1 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Buy Me a Coffee</span>
            </a>
            <span>•</span>
            <a
              href="https://opencollective.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-300 flex items-center space-x-1 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Collective</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
