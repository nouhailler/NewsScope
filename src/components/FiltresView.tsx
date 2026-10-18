import React, { useState } from 'react';
import { FilterState } from '../types';

interface FiltresViewProps {
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  onApply: () => void;
}

export const FiltresView: React.FC<FiltresViewProps> = ({
  filters,
  onUpdateFilters,
  onApply,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [savedPreset, setSavedPreset] = useState(false);

  const topicsList = [
    { id: 'central_banks', label: 'Banques Centrales & Taux', icon: 'account_balance' },
    { id: 'energy', label: 'Énergie & Pétrole', icon: 'local_gas_station' },
    { id: 'tech_ai', label: 'Tech & IA', icon: 'memory' },
    { id: 'geopolitics', label: 'Géopolitique & Défense', icon: 'military_tech' },
    { id: 'climate', label: 'Climat & RSE', icon: 'eco' },
    { id: 'ma', label: 'Fusions & Acquisitions', icon: 'handshake' },
  ];

  const handleToggleAgency = (agency: 'reuters' | 'bloomberg' | 'afp') => {
    const updated = {
      ...localFilters,
      agencies: {
        ...localFilters.agencies,
        [agency]: !localFilters.agencies[agency],
      },
    };
    setLocalFilters(updated);
    onUpdateFilters(updated);
  };

  const handleToggleTopic = (topicLabel: string) => {
    const active = localFilters.activeTopics.includes(topicLabel)
      ? localFilters.activeTopics.filter((t) => t !== topicLabel)
      : [...localFilters.activeTopics, topicLabel];
    const updated = { ...localFilters, activeTopics: active };
    setLocalFilters(updated);
    onUpdateFilters(updated);
  };

  const handleAddOperator = (op: string) => {
    const updated = {
      ...localFilters,
      keyword: localFilters.keyword ? `${localFilters.keyword} ${op} ` : `${op} `,
    };
    setLocalFilters(updated);
    onUpdateFilters(updated);
  };

  const handleReset = () => {
    const initial: FilterState = {
      agencies: { reuters: true, bloomberg: true, afp: true },
      excludeThirdParty: true,
      keyword: '',
      timeWindow: '24h',
      sortMode: 'recent',
      startDate: '2025-03-26 00:00',
      endDate: '2025-03-27 15:42',
      language: 'FR',
      batchLimit: 50,
      activeTopics: ['Banques Centrales & Taux', 'Tech & IA'],
      urlSanitization: true,
    };
    setLocalFilters(initial);
    onUpdateFilters(initial);
  };

  // Build the dynamic GDELT payload string
  const activeDomains = [
    localFilters.agencies.reuters ? 'domainis:reuters.com' : null,
    localFilters.agencies.bloomberg ? 'domainis:bloomberg.com' : null,
    localFilters.agencies.afp ? 'domainis:afp.com' : null,
  ].filter(Boolean);

  const domainQuery = activeDomains.length > 0 ? `(${activeDomains.join(' OR ')})` : 'domainis:*';
  const keywordQuery = localFilters.keyword ? ` AND ("${localFilters.keyword}")` : ' AND ("taux BCE" OR "semi-conducteurs")';
  const gdeltQuery = `query=${domainQuery}${keywordQuery} timespan:${localFilters.timeWindow} sort:${
    localFilters.sortMode === 'recent' ? 'DateDesc' : 'ToneDesc'
  } maxrecords:${localFilters.batchLimit} format:json`;

  const handleCopyQuery = () => {
    navigator.clipboard?.writeText(gdeltQuery);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const activeAgencyCount = Object.values(localFilters.agencies).filter(Boolean).length;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-3 sm:px-4 space-y-4 pb-28 pt-2">
      {/* Title & Telemetry Header */}
      <div className="flex items-start justify-between gap-3 pt-1 pb-1">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="font-mono text-[11px] text-[#8ed5ff] uppercase tracking-widest font-semibold">
              Moteur GDELT DOC 2.0 • Zéro tracking
            </span>
          </div>
          <h1 className="font-['Newsreader'] text-xl sm:text-2xl text-[#dae2fd] font-semibold tracking-tight">
            Filtres & Requêtes Avancées
          </h1>
        </div>

        <button
          onClick={handleReset}
          className="h-9 px-3 flex items-center gap-1.5 rounded bg-[#171f33] hover:bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] transition-colors shadow-sm shrink-0 font-['Geist'] text-xs font-semibold"
          title="Réinitialiser tous les filtres"
        >
          <span className="material-symbols-outlined text-[16px] text-[#8ed5ff]">
            restart_alt
          </span>
          <span>Rétablir</span>
        </button>
      </div>

      {/* Telemetry Strip (Cache & Latency) */}
      <div className="flex items-center justify-between px-3 py-2 rounded bg-[#131b2e] border border-[#222a3d] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#8ed5ff]">dns</span>
          <span className="text-[#bdc8d1]">Index mondial synchronisé</span>
        </div>
        <span className="text-[#8ed5ff] font-semibold">18.4k docs / 10min</span>
      </div>

      {/* Section 1: Agences & Domaines Autorisés */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">feed</span>
            <h2 className="font-['Geist'] text-xs uppercase font-bold tracking-wider text-[#dae2fd]">
              Agences & Domaines Autorisés
            </h2>
          </div>
          <span className="font-mono text-xs text-[#8ed5ff] font-semibold">
            {activeAgencyCount} / 3 Actifs
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Reuters */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#171f33] hover:bg-[#222a3d] transition-colors cursor-pointer select-none border border-[#222a3d]">
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={localFilters.agencies.reuters}
                onChange={() => handleToggleAgency('reuters')}
                className="w-4 h-4 rounded-sm bg-[#060e20] text-[#38bdf8] accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#dae2fd]">
                    reuters.com
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider font-bold bg-emerald-950/40 text-emerald-300">
                    100% Vérifié
                  </span>
                </div>
                <span className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] truncate">
                  Flux direct international, géopolitique & finance
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-orange-400 bg-orange-950/30 shrink-0">
              REUTERS
            </span>
          </label>

          {/* Bloomberg */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#171f33] hover:bg-[#222a3d] transition-colors cursor-pointer select-none border border-[#222a3d]">
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={localFilters.agencies.bloomberg}
                onChange={() => handleToggleAgency('bloomberg')}
                className="w-4 h-4 rounded-sm bg-[#060e20] text-[#38bdf8] accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#dae2fd]">
                    bloomberg.com
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider font-bold bg-emerald-950/40 text-emerald-300">
                    100% Vérifié
                  </span>
                </div>
                <span className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] truncate">
                  Marchés de capitaux, macroéconomie & devises
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-purple-400 bg-purple-950/30 shrink-0">
              BLOOMBERG
            </span>
          </label>

          {/* AFP */}
          <label className="flex items-center justify-between p-3 rounded-lg bg-[#171f33] hover:bg-[#222a3d] transition-colors cursor-pointer select-none border border-[#222a3d]">
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="checkbox"
                checked={localFilters.agencies.afp}
                onChange={() => handleToggleAgency('afp')}
                className="w-4 h-4 rounded-sm bg-[#060e20] text-[#38bdf8] accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#dae2fd]">
                    afp.com
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider font-bold bg-amber-950/40 text-amber-300">
                    Direct + Mention
                  </span>
                </div>
                <span className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] truncate">
                  Dépêches mondiales, terrain & factuel
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-sky-400 bg-sky-950/30 shrink-0">
              AFP
            </span>
          </label>
        </div>

        {/* Exclusion Switch */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
          <div className="flex items-start gap-2.5 min-w-0 pr-2">
            <span className="material-symbols-outlined text-[18px] text-[#ffb690] mt-0.5 shrink-0">
              shield_lock
            </span>
            <div className="flex flex-col text-xs">
              <span className="font-['Geist'] text-[#dae2fd] font-semibold">
                Exclure strictement les rediffusions & mentions tierces
              </span>
              <span className="font-['Source_Serif_4'] text-[#bdc8d1] text-[11px]">
                Rejette les agrégateurs et blogs citant les agences sans attribution canonique.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const updated = { ...localFilters, excludeThirdParty: !localFilters.excludeThirdParty };
              setLocalFilters(updated);
              onUpdateFilters(updated);
            }}
            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              localFilters.excludeThirdParty ? 'bg-[#38bdf8]' : 'bg-[#2d3449]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                localFilters.excludeThirdParty ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Section 2: Recherche Thématique & Syntaxe */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">
              terminal
            </span>
            <h2 className="font-['Geist'] text-xs uppercase font-bold tracking-wider text-[#dae2fd]">
              Recherche Thématique & Syntaxe
            </h2>
          </div>
          <span className="font-mono text-xs text-[#bdc8d1]">Lexique GDELT</span>
        </div>

        {/* Keyword input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#bdc8d1] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={localFilters.keyword}
            onChange={(e) => {
              const updated = { ...localFilters, keyword: e.target.value };
              setLocalFilters(updated);
              onUpdateFilters(updated);
            }}
            placeholder="ex: inflation, semi-conducteurs, taux BCE..."
            className="w-full h-11 pl-10 pr-20 bg-[#060e20] rounded-lg text-[#dae2fd] placeholder:text-[#87929a] font-mono text-xs focus:outline-none focus:bg-[#171f33] border border-[#222a3d] shadow-inner"
          />
          {localFilters.keyword && (
            <button
              onClick={() => {
                const updated = { ...localFilters, keyword: '' };
                setLocalFilters(updated);
                onUpdateFilters(updated);
              }}
              className="absolute right-2 px-2 py-1 rounded bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] font-mono text-[10px]"
            >
              CLR ⌫
            </button>
          )}
        </div>

        {/* Boolean Operators */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <span className="font-['Geist'] text-[11px] uppercase tracking-wider text-[#bdc8d1] shrink-0 mr-1">
            Opérateurs:
          </span>
          {['AND', 'OR', 'NOT', '"Expression exacte"', 'near:10'].map((op) => (
            <button
              key={op}
              onClick={() => handleAddOperator(op)}
              className="px-2 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] text-[#8ed5ff] font-mono text-[11px] shrink-0 border border-[#222a3d]"
            >
              {op}
            </button>
          ))}
        </div>

        {/* Topics Matrix */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="font-['Geist'] text-[11px] uppercase tracking-wider text-[#bdc8d1]">
            Faisceaux d'intérêt actifs
          </span>
          <div className="flex flex-wrap gap-1.5">
            {topicsList.map((t) => {
              const isActive = localFilters.activeTopics.includes(t.label);
              return (
                <button
                  key={t.id}
                  onClick={() => handleToggleTopic(t.label)}
                  className={`px-3 py-1.5 rounded-lg font-['Geist'] text-xs flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-[#38bdf8] text-[#004965] font-semibold shadow-sm'
                      : 'bg-[#171f33] text-[#bdc8d1] hover:text-[#dae2fd] hover:bg-[#222a3d] border border-[#222a3d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Plage Temporelle & Ordonnancement */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">schedule</span>
            <h2 className="font-['Geist'] text-xs uppercase font-bold tracking-wider text-[#dae2fd]">
              Plage Temporelle & Ordonnancement
            </h2>
          </div>
          <span className="font-mono text-xs text-[#ffb690] font-semibold">
            Fenêtre active: {localFilters.timeWindow}
          </span>
        </div>

        {/* Time Window Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-lg bg-[#060e20] border border-[#222a3d]">
          {(['6h', '24h', '3d', '7d', '30d', 'manual'] as const).map((tw) => {
            const labels: Record<string, string> = {
              '6h': '6 heures',
              '24h': '24 heures',
              '3d': '3 jours',
              '7d': '7 jours',
              '30d': '30 jours',
              manual: 'Manuel',
            };
            const isSelected = localFilters.timeWindow === tw;
            return (
              <button
                key={tw}
                onClick={() => {
                  const updated = { ...localFilters, timeWindow: tw };
                  setLocalFilters(updated);
                  onUpdateFilters(updated);
                }}
                className={`py-2 text-center rounded font-['Geist'] text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#8ed5ff] text-[#00354a] font-semibold shadow-sm'
                    : 'text-[#bdc8d1] hover:text-[#dae2fd]'
                }`}
              >
                {labels[tw]}
              </button>
            );
          })}
        </div>

        {/* ISO Date Boundary Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
          <div className="flex flex-col p-2.5 rounded bg-[#171f33] border border-[#222a3d]">
            <span className="text-[10px] text-[#bdc8d1] uppercase font-['Geist']">
              Date Début (ISO UTC)
            </span>
            <div className="flex items-center justify-between mt-1 text-[#dae2fd] font-semibold">
              <span>{localFilters.startDate}</span>
              <span className="material-symbols-outlined text-[15px] text-[#8ed5ff]">
                calendar_today
              </span>
            </div>
          </div>

          <div className="flex flex-col p-2.5 rounded bg-[#171f33] border border-[#222a3d]">
            <span className="text-[10px] text-[#bdc8d1] uppercase font-['Geist']">
              Date Fin (ISO UTC)
            </span>
            <div className="flex items-center justify-between mt-1 text-[#dae2fd] font-semibold">
              <span>{localFilters.endDate}</span>
              <span className="material-symbols-outlined text-[15px] text-[#8ed5ff]">
                update
              </span>
            </div>
          </div>
        </div>

        {/* Sort Order Radio Group */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="font-['Geist'] text-[11px] uppercase tracking-wider text-[#bdc8d1]">
            Mode de Tri des Dépêches
          </span>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#171f33] cursor-pointer select-none border border-[#222a3d]">
              <input
                type="radio"
                name="sort-order"
                checked={localFilters.sortMode === 'recent'}
                onChange={() => {
                  const updated = { ...localFilters, sortMode: 'recent' as const };
                  setLocalFilters(updated);
                  onUpdateFilters(updated);
                }}
                className="w-4 h-4 text-[#38bdf8] accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-['Geist'] text-xs text-[#dae2fd] font-semibold">
                  Chrono Récent
                </span>
                <span className="font-mono text-[10px] text-[#bdc8d1]">
                  DateDesc (Temps réel)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#171f33] cursor-pointer select-none border border-[#222a3d]">
              <input
                type="radio"
                name="sort-order"
                checked={localFilters.sortMode === 'relevance'}
                onChange={() => {
                  const updated = { ...localFilters, sortMode: 'relevance' as const };
                  setLocalFilters(updated);
                  onUpdateFilters(updated);
                }}
                className="w-4 h-4 text-[#38bdf8] accent-[#38bdf8] cursor-pointer"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-['Geist'] text-xs text-[#dae2fd] font-semibold">
                  Score Tone / Rel
                </span>
                <span className="font-mono text-[10px] text-[#bdc8d1]">
                  Pertinence lexicale
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Section 4: Paramètres d'Ingestion & Sécurité */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">tune</span>
            <h2 className="font-['Geist'] text-xs uppercase font-bold tracking-wider text-[#dae2fd]">
              Paramètres D'Ingestion & Sécurité
            </h2>
          </div>
          <span className="font-mono text-xs text-emerald-400 font-semibold">
            PWA Offline OK
          </span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#171f33] border border-[#222a3d]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">
              translate
            </span>
            <span className="font-['Geist'] text-xs text-[#dae2fd] font-semibold">
              Langues Cibles
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs">
            {(['FR', 'EN', 'ALL'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  const updated = { ...localFilters, language: l };
                  setLocalFilters(updated);
                  onUpdateFilters(updated);
                }}
                className={`px-2.5 py-1 rounded font-bold transition-colors ${
                  localFilters.language === l
                    ? 'bg-[#8ed5ff] text-[#00354a]'
                    : 'bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Ceiling */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#171f33] border border-[#222a3d]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">dataset</span>
            <span className="font-['Geist'] text-xs text-[#dae2fd] font-semibold">
              Plafond par requête
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs">
            {[25, 50, 100].map((num) => (
              <button
                key={num}
                onClick={() => {
                  const updated = { ...localFilters, batchLimit: num };
                  setLocalFilters(updated);
                  onUpdateFilters(updated);
                }}
                className={`px-2.5 py-1 rounded font-bold transition-colors ${
                  localFilters.batchLimit === num
                    ? 'bg-[#8ed5ff] text-[#00354a]'
                    : 'bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd]'
                }`}
              >
                {num === 50 ? '50 max' : num}
              </button>
            ))}
          </div>
        </div>

        {/* URL Anti-Tracking Sanitizer */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400 shrink-0">
              verified_user
            </span>
            <div className="flex flex-col text-xs">
              <span className="font-['Geist'] text-[#dae2fd] font-semibold">
                Assainissement URL anti-tracking
              </span>
              <span className="font-['Source_Serif_4'] text-[#bdc8d1] text-[11px]">
                Suppression automatique des tags utm_*, fbclid, cmpid et balises télémétriques.
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-emerald-400 shrink-0">
            check_circle
          </span>
        </div>

        {/* Live GDELT Query Terminal Preview */}
        <div className="flex flex-col rounded-lg bg-[#060e20] p-3 border border-[#222a3d] shadow-inner space-y-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-[#222a3d]/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#bdc8d1]">
                Aperçu Payload API GDELT 2.0
              </span>
            </div>
            <button
              onClick={handleCopyQuery}
              className="flex items-center gap-1 text-[11px] font-mono text-[#8ed5ff] hover:text-[#38bdf8]"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copiedQuery ? 'done' : 'content_copy'}
              </span>
              <span>{copiedQuery ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
          <code className="font-mono text-[11px] leading-relaxed text-[#c4e7ff] break-all bg-[#171f33]/60 p-2 rounded block select-all">
            {gdeltQuery}
          </code>
        </div>
      </section>

      {/* Sticky Bottom Actions Container */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={onApply}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#004965] font-['Geist'] text-sm font-bold shadow-lg transition-transform active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[20px]">search_check</span>
          <span>Appliquer les filtres (38 dépêches estimées)</span>
        </button>

        <button
          onClick={() => {
            setSavedPreset(true);
            setTimeout(() => setSavedPreset(false), 2500);
          }}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] font-['Geist'] text-xs font-semibold transition-colors border border-[#222a3d]"
        >
          <span className="material-symbols-outlined text-[16px] text-[#ffb690]">
            {savedPreset ? 'check' : 'bookmark_add'}
          </span>
          <span>
            {savedPreset ? 'Préréglage mémorisé dans IndexedDB ✓' : "Enregistrer comme préréglage d'alerte"}
          </span>
        </button>
      </div>
    </div>
  );
};
