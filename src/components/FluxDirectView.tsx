import React, { useState } from 'react';
import { Dispatch, AgencyId } from '../types';

interface FluxDirectViewProps {
  dispatches: Dispatch[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectDispatch: (id: string) => void;
  onOpenDiagnostic: () => void;
  isOffline: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const FluxDirectView: React.FC<FluxDirectViewProps> = ({
  dispatches,
  favorites,
  onToggleFavorite,
  onSelectDispatch,
  onOpenDiagnostic,
  isOffline,
  onRefresh,
  isRefreshing,
}) => {
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'relevance'>('recent');
  const [timeWindow, setTimeWindow] = useState<'24h' | '7j' | '30j'>('24h');
  const [showBanner, setShowBanner] = useState(true);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [highlightToast, setHighlightToast] = useState(true);

  const agencyCounts = {
    all: dispatches.length,
    reuters: dispatches.filter((d) => d.agency === 'reuters').length,
    bloomberg: dispatches.filter((d) => d.agency === 'bloomberg').length,
    afp: dispatches.filter((d) => d.agency === 'afp').length,
  };

  const filteredDispatches = dispatches.filter((d) => {
    if (selectedAgency !== 'all' && d.agency !== selectedAgency) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchExcerpt = d.excerpt.toLowerCase().includes(q);
      const matchCategory = d.category.toLowerCase().includes(q);
      const matchTags = d.thematicTags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchCategory && !matchTags) {
        return false;
      }
    }
    return true;
  });

  const handleFullSync = () => {
    setIsFullSyncing(true);
    setTimeout(() => {
      setIsFullSyncing(false);
      onRefresh();
    }, 900);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-4 space-y-4 pb-24 pt-2">
      {/* 1. Dynamic Reconnection / Telemetry Banner */}
      {showBanner && (
        <section
          id="reconnect-banner"
          className="flex flex-col bg-[#131b2e] rounded-xl p-3.5 sm:p-4 shadow-md relative overflow-hidden border border-[#222a3d]"
        >
          {/* Top accent glow */}
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              isOffline ? 'bg-amber-400' : 'bg-[#38bdf8]'
            }`}
          />
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#222a3d] flex items-center justify-center text-[#38bdf8] shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {isOffline ? 'cloud_off' : 'wifi_tethering'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-['Geist'] text-[11px] text-[#38bdf8] uppercase tracking-wider font-bold">
                  {isOffline ? 'Coupure Réseau Détectée' : 'Connectivité rétablie'}
                </span>
                <span className="font-mono text-[10px] text-[#bdc8d1]">
                  {isOffline ? 'IndexedDB Local Cache fallback' : 'window.online event · Paris CDG'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#222a3d] text-[#38bdf8] font-mono text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                {isOffline ? 'OFF-GRID' : '88% ACHEVÉ'}
              </span>
              <button
                onClick={() => setShowBanner(false)}
                className="text-[#87929a] hover:text-[#dae2fd] p-1"
                title="Masquer le bandeau"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>

          <p className="font-['Source_Serif_4'] text-[13px] text-[#dae2fd] leading-relaxed mb-2.5">
            {isOffline ? (
              <>
                Mode hors-ligne souverain. <strong>{dispatches.length} dépêches</strong> stockées
                en sandbox IndexedDB restent consultables et annotables sans fuite réseau.
              </>
            ) : (
              <>
                Rétablissement de la liaison montante. <strong>18 dépêches indexées</strong> depuis
                GDELT DOC 2.0 avec réconciliation déterministe du magasin local IndexedDB.
              </>
            )}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-[#2d3449] rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isOffline ? 'bg-amber-400' : 'bg-[#38bdf8]'
              }`}
              style={{ width: isOffline ? '100%' : '88%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[#bdc8d1] font-mono text-[11px] mb-3">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">
                sync_alt
              </span>
              {isOffline ? '14/14 en cache · 0 paquet émis' : '18/18 ingérées · 0 doublon'}
            </span>
            <span className="text-[#dae2fd]">{isOffline ? '0 ms (Local)' : '210 ms (CDG Edge)'}</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#222a3d]/60">
            <button
              onClick={handleFullSync}
              disabled={isFullSyncing}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] font-['Geist'] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[14px] ${
                  isFullSyncing ? 'animate-spin' : ''
                }`}
              >
                bolt
              </span>
              <span>
                {isFullSyncing ? 'Réconciliation...' : 'Forcer synchronisation complète'}
              </span>
            </button>
            <button
              onClick={onOpenDiagnostic}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-[#171f33] text-[#38bdf8] hover:bg-[#222a3d] font-['Geist'] text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>Sondes</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. Floating Notification Toast (Nouveaux flux reçus) */}
      {highlightToast && (
        <div
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setHighlightToast(false);
          }}
          className="flex items-center justify-between px-4 py-2 bg-[#222a3d] hover:bg-[#2d3449] rounded-full shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all border border-[#38bdf8]/30"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38bdf8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38bdf8]" />
            </span>
            <span className="font-['Geist'] text-xs sm:text-sm text-[#dae2fd] font-semibold">
              ↑ +18 nouvelles dépêches reçues en direct
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#ec6a06] text-[#341100] font-mono text-[10px] font-bold uppercase tracking-wider">
              NOUVEAU
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHighlightToast(false);
              }}
              className="text-[#87929a] hover:text-[#dae2fd] ml-1"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Search & Control Bar */}
      <section className="flex flex-col gap-2.5">
        {/* Search Field */}
        <div className="relative flex items-center w-full bg-[#060e20] rounded-lg shadow-inner border border-[#222a3d]">
          <span className="material-symbols-outlined absolute left-3 text-[#bdc8d1] text-[18px]">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par mot-clé (ex: taux BCE, inflation, climat, IA)..."
            className="w-full h-11 pl-10 pr-20 bg-transparent text-[#dae2fd] placeholder:text-[#87929a] font-['Geist'] text-xs sm:text-sm focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 px-2 py-1 rounded bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] font-mono text-[11px]"
            >
              CLR ⌫
            </button>
          )}
        </div>

        {/* Agency Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedAgency('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedAgency === 'all'
                ? 'bg-[#8ed5ff] text-[#00354a]'
                : 'bg-[#171f33] text-[#bdc8d1] hover:bg-[#222a3d]'
            }`}
          >
            <span>Toutes</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                selectedAgency === 'all'
                  ? 'bg-[#00354a]/20 text-[#00354a]'
                  : 'bg-[#2d3449] text-[#bdc8d1]'
              }`}
            >
              {agencyCounts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedAgency('reuters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold whitespace-nowrap transition-all ${
              selectedAgency === 'reuters'
                ? 'bg-[#ffb690] text-[#552100]'
                : 'bg-[#171f33] text-[#ffb690] hover:bg-[#222a3d]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a06]" />
            <span>Reuters</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                selectedAgency === 'reuters'
                  ? 'bg-[#552100]/20 text-[#552100]'
                  : 'bg-[#2d3449] text-[#ffb690]'
              }`}
            >
              {agencyCounts.reuters}
            </span>
          </button>

          <button
            onClick={() => setSelectedAgency('bloomberg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold whitespace-nowrap transition-all ${
              selectedAgency === 'bloomberg'
                ? 'bg-[#e1bfff] text-[#490080]'
                : 'bg-[#171f33] text-[#e1bfff] hover:bg-[#222a3d]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ce9bff]" />
            <span>Bloomberg</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                selectedAgency === 'bloomberg'
                  ? 'bg-[#490080]/20 text-[#490080]'
                  : 'bg-[#2d3449] text-[#e1bfff]'
              }`}
            >
              {agencyCounts.bloomberg}
            </span>
          </button>

          <button
            onClick={() => setSelectedAgency('afp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold whitespace-nowrap transition-all ${
              selectedAgency === 'afp'
                ? 'bg-[#38bdf8] text-[#004965]'
                : 'bg-[#171f33] text-[#8ed5ff] hover:bg-[#222a3d]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ed5ff]" />
            <span>AFP</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                selectedAgency === 'afp'
                  ? 'bg-[#004965]/20 text-[#004965]'
                  : 'bg-[#2d3449] text-[#8ed5ff]'
              }`}
            >
              {agencyCounts.afp}
            </span>
          </button>
        </div>

        {/* Dual Sort & Timeline Bar */}
        <div className="flex items-center justify-between gap-2 text-[#bdc8d1] pt-1">
          <div className="flex items-center gap-1 bg-[#131b2e] p-0.5 rounded-lg border border-[#222a3d]">
            <button
              onClick={() => setSortMode('recent')}
              className={`px-2.5 py-1 rounded text-xs font-semibold font-['Geist'] transition-colors ${
                sortMode === 'recent'
                  ? 'bg-[#222a3d] text-[#8ed5ff]'
                  : 'text-[#bdc8d1] hover:text-[#dae2fd]'
              }`}
            >
              Plus récentes
            </button>
            <button
              onClick={() => setSortMode('relevance')}
              className={`px-2.5 py-1 rounded text-xs font-semibold font-['Geist'] transition-colors ${
                sortMode === 'relevance'
                  ? 'bg-[#222a3d] text-[#8ed5ff]'
                  : 'text-[#bdc8d1] hover:text-[#dae2fd]'
              }`}
            >
              Pertinence
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#131b2e] p-0.5 rounded-lg font-mono text-[11px] border border-[#222a3d]">
            {(['24h', '7j', '30j'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className={`px-2 py-1 rounded font-semibold transition-colors ${
                  timeWindow === w
                    ? 'bg-[#222a3d] text-[#dae2fd]'
                    : 'text-[#bdc8d1] hover:text-[#dae2fd]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="font-['Geist'] text-xs font-bold tracking-wider text-[#dae2fd] uppercase">
            Flux Unifié ({filteredDispatches.length})
          </span>
          <span className="px-1.5 py-0.2 rounded bg-[#222a3d] font-mono text-[10px] text-[#38bdf8] font-bold">
            SYNC-OK
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#bdc8d1]">
          Dernière salve: 14:02:44
        </span>
      </div>

      {/* 5. Live Feed Dispatch Cards */}
      <div className="flex flex-col gap-3">
        {filteredDispatches.map((dispatch, idx) => {
          const isSaved = favorites.includes(dispatch.id);

          // Card 1 or general card
          return (
            <React.Fragment key={dispatch.id}>
              {/* Optional Separator before AIE Wire or cache items */}
              {dispatch.agency === 'aie' && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-[#222a3d]" />
                  <span className="font-mono text-[11px] text-[#bdc8d1] uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">
                      inventory_2
                    </span>
                    Dépêches locales réconciliées
                  </span>
                  <div className="flex-1 h-px bg-[#222a3d]" />
                </div>
              )}

              <article
                className={`flex flex-col bg-[#131b2e] rounded-xl p-3.5 sm:p-4 relative overflow-hidden transition-all duration-200 group hover:bg-[#171f33] border border-[#222a3d] shadow-md ${
                  dispatch.isThirdPartyMention ? 'border-amber-400/30' : ''
                }`}
              >
                {/* Agency Accent Stripe */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    dispatch.agency === 'reuters'
                      ? 'bg-[#ec6a06]'
                      : dispatch.agency === 'bloomberg'
                      ? 'bg-[#ce9bff]'
                      : dispatch.agency === 'afp'
                      ? 'bg-[#38bdf8]'
                      : 'bg-[#87929a]'
                  }`}
                />

                {/* Card Top Metadata Line */}
                <div className="flex items-center justify-between mb-2 pl-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Agency Label Badge */}
                    <span
                      className={`px-2 py-0.5 rounded font-['Geist'] text-[10px] font-bold tracking-wider uppercase ${dispatch.agencyClass}`}
                    >
                      {dispatch.agencyLabel}
                    </span>

                    {/* Verification or Sync Chip */}
                    {dispatch.isVerified && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222a3d] text-[#38bdf8] font-mono text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[13px]">
                          verified
                        </span>
                        <span>{idx === 0 ? 'FLUX RÉTABLI' : 'VÉRIFIÉ'}</span>
                      </span>
                    )}

                    {dispatch.isThirdPartyMention && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[10px] font-bold uppercase">
                        <span className="material-symbols-outlined text-[13px]">
                          warning
                        </span>
                        <span>Rediffusion tierce</span>
                      </span>
                    )}

                    {dispatch.agency === 'bloomberg' && idx === 1 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222a3d] text-[#38bdf8] font-mono text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
                        <span>NOUVEAU • EN DIRECT</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#bdc8d1]">
                      {dispatch.timeAgo}
                    </span>
                    <button
                      onClick={() => onToggleFavorite(dispatch.id)}
                      aria-label={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isSaved
                          ? 'text-[#ffb690] bg-[#ec6a06]/20'
                          : 'text-[#bdc8d1] hover:text-[#ffb690] hover:bg-[#222a3d]'
                      }`}
                      title={isSaved ? 'Enregistré dans les favoris' : 'Épingler dans les favoris'}
                    >
                      <span
                        className="material-symbols-outlined text-[19px]"
                        style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>
                </div>

                {/* Headline (Click opens DetailView) */}
                <h2
                  onClick={() => onSelectDispatch(dispatch.id)}
                  className="font-['Newsreader'] text-[17px] sm:text-[19px] text-[#dae2fd] font-semibold leading-snug tracking-tight mb-1.5 pl-2 group-hover:text-[#8ed5ff] cursor-pointer transition-colors"
                >
                  {dispatch.title}
                </h2>

                {/* Third Party Warning Callout */}
                {dispatch.isThirdPartyMention && dispatch.thirdPartyWarning && (
                  <div className="flex items-start gap-2 p-2.5 my-1 ml-2 rounded bg-amber-400/10 text-amber-200 border border-amber-400/20">
                    <span className="material-symbols-outlined text-[17px] text-amber-300 mt-0.5 shrink-0">
                      info
                    </span>
                    <span className="font-['Source_Serif_4'] text-xs leading-snug">
                      {dispatch.thirdPartyWarning}
                    </span>
                  </div>
                )}

                {/* Excerpt */}
                <p className="font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#bdc8d1] leading-relaxed line-clamp-2 pl-2 mb-2.5">
                  {dispatch.excerpt}
                </p>

                {/* Visual Media if present (e.g. Copernicus Climat) */}
                {dispatch.mediaImage && (
                  <div
                    onClick={() => onSelectDispatch(dispatch.id)}
                    className="relative w-full h-36 rounded-lg overflow-hidden my-2 cursor-pointer bg-[#060e20] border border-[#222a3d]"
                  >
                    <img
                      src={dispatch.mediaImage}
                      alt={dispatch.mediaCaption || dispatch.title}
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] via-[#0b1326]/30 to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-[#060e20]/80 backdrop-blur-md text-[#8ed5ff] font-mono text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">
                        satellite_alt
                      </span>
                      <span>COPERNICUS SENTINEL-5P</span>
                    </div>
                  </div>
                )}

                {/* Sparkline Graphic for AIE Energy */}
                {dispatch.hasSparkline && (
                  <div className="bg-[#060e20] rounded-lg p-2.5 my-1.5 ml-2 border border-[#222a3d]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#bdc8d1] mb-1">
                      <span>Projection Off-Grid (Stockée)</span>
                      <span className="text-[#38bdf8] font-bold">103.2 Mb/j (+0.4%)</span>
                    </div>
                    <svg
                      className="w-full h-8 text-[#38bdf8]"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 320 40"
                    >
                      <path
                        d="M0 35 L40 32 L80 28 L120 22 L160 25 L200 18 L240 14 L280 12 L320 8"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M0 35 L40 32 L80 28 L120 22 L160 25 L200 18 L240 14 L280 12 L320 8 L320 40 L0 40 Z"
                        fill="currentColor"
                        fillOpacity="0.12"
                      />
                    </svg>
                  </div>
                )}

                {/* Market Metric pill if present */}
                {dispatch.marketMetric && !dispatch.hasSparkline && (
                  <div className="flex items-center gap-3 py-1 px-2.5 ml-2 mb-2 rounded bg-[#060e20] text-xs font-mono border border-[#222a3d] text-[#bdc8d1]">
                    <span>
                      {dispatch.marketMetric.label} :{' '}
                      <strong className="text-[#dae2fd]">
                        {dispatch.marketMetric.value}
                      </strong>
                    </span>
                    <span
                      className={`font-semibold ${
                        dispatch.marketMetric.isPositive
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {dispatch.marketMetric.change}
                    </span>
                  </div>
                )}

                {/* Footer Strip */}
                <div className="flex items-center justify-between pl-2 pt-2 border-t border-[#222a3d]/60 text-[#bdc8d1] font-mono text-[11px]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#dae2fd] font-medium truncate">
                      {dispatch.thirdPartySource ||
                        (dispatch.agency === 'reuters'
                          ? 'reuters.com'
                          : dispatch.agency === 'bloomberg'
                          ? 'bloomberg.com'
                          : 'afp.com')}
                    </span>
                    <span className="opacity-40">·</span>
                    <span className="text-[#87929a] truncate">
                      HASH: #{dispatch.sha256.slice(0, 6)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectDispatch(dispatch.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222a3d] hover:bg-[#38bdf8] text-[#dae2fd] hover:text-[#004965] font-['Geist'] text-xs font-semibold transition-colors"
                    >
                      <span>Consulter</span>
                      <span className="material-symbols-outlined text-[13px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            </React.Fragment>
          );
        })}
      </div>

      {/* 6. PWA Offline Telemetry Banner */}
      <footer className="mt-4 pt-2">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#131b2e] text-[#dae2fd] shadow-sm border border-[#222a3d]">
          <div className="w-9 h-9 rounded-full bg-[#8ed5ff]/10 flex items-center justify-center shrink-0 text-[#8ed5ff]">
            <span className="material-symbols-outlined text-[20px]">offline_pin</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-['Geist'] text-xs font-semibold text-[#8ed5ff]">
              Mode hors-ligne actif (IndexedDB)
            </span>
            <span className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] leading-snug">
              {favorites.length} dépêches en cache local. Vos favoris et notes restent consultables
              instantanément sans accès réseau.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
