import React, { useState } from 'react';
import { Dispatch, DataSourceMode, LiveFetchState } from '../types';
import { FreshnessBanner } from './FreshnessBanner';

interface FluxDirectViewProps {
  dispatches: Dispatch[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectDispatch: (id: string) => void;
  onOpenDiagnostic: () => void;
  isOffline: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  dataMode: DataSourceMode;
  onToggleDataMode: () => void;
  liveState: LiveFetchState;
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
  dataMode,
  onToggleDataMode,
  liveState,
}) => {
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'relevance'>('recent');
  const [timeWindow, setTimeWindow] = useState<'24h' | '7j' | '30j'>('24h');
  const [showBanner, setShowBanner] = useState(true);

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

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-4 space-y-4 pb-24 pt-2">
      {/* 1. Dynamic Status / Telemetry Banner (Honest & Informative) */}
      {showBanner && (
        <section
          id="reconnect-banner"
          className="flex flex-col bg-[#131b2e] rounded-xl p-3.5 sm:p-4 shadow-md relative overflow-hidden border border-[#222a3d]"
        >
          {/* Top accent glow */}
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              isOffline
                ? 'bg-amber-400'
                : dataMode === 'demo'
                ? 'bg-amber-400'
                : liveState.lastError
                ? 'bg-rose-400'
                : 'bg-[#38bdf8]'
            }`}
          />
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#222a3d] flex items-center justify-center text-[#38bdf8] shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {isOffline
                    ? 'cloud_off'
                    : dataMode === 'demo'
                    ? 'science'
                    : liveState.lastError
                    ? 'error'
                    : 'wifi_tethering'}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-['Geist'] text-[11px] uppercase tracking-wider font-bold ${
                    isOffline
                      ? 'text-amber-300'
                      : dataMode === 'demo'
                      ? 'text-amber-300'
                      : liveState.lastError
                      ? 'text-rose-300'
                      : 'text-[#38bdf8]'
                  }`}
                >
                  {isOffline
                    ? 'Mode Hors-Ligne Souverain'
                    : dataMode === 'demo'
                    ? 'Jeu de Démonstration Fictif'
                    : liveState.rateLimited
                    ? 'GDELT 429 : Cooldown Actif'
                    : liveState.lastError
                    ? 'Erreur Connecteur GDELT'
                    : 'Connexion Directe GDELT DOC 2.0'}
                </span>
                <span className="font-mono text-[10px] text-[#bdc8d1]">
                  {isOffline
                    ? 'IndexedDB Local Cache fallback (0 émission réseau)'
                    : dataMode === 'demo'
                    ? 'Données de test statiques labellisées (non représentatives du direct)'
                    : liveState.lastFetchTime
                    ? `Dernière interrogation : ${liveState.lastFetchTime.toLocaleTimeString()}`
                    : 'Prêt pour interrogation live'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                  dataMode === 'demo'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : isOffline
                    ? 'bg-amber-400/20 text-amber-300'
                    : 'bg-[#222a3d] text-[#38bdf8]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dataMode === 'demo'
                      ? 'bg-amber-400'
                      : isOffline
                      ? 'bg-amber-400'
                      : 'bg-[#38bdf8] animate-pulse'
                  }`}
                />
                {isOffline
                  ? 'OFF-GRID'
                  : dataMode === 'demo'
                  ? 'DONNÉES FICTIVES'
                  : `${dispatches.length} ARTICLES`}
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
                Mode hors-ligne souverain actif. <strong>{dispatches.length} dépêches</strong> stockées
                en sandbox IndexedDB restent consultables et annotables sans émission réseau.
              </>
            ) : dataMode === 'demo' ? (
              <>
                Ces dépêches sont <strong>explicitement fictives</strong> et fournies pour valider
                l'ergonomie et les filtres. Basculez sur l'interrogation directe pour appeler
                l'API publique GDELT DOC 2.0 en temps réel.
              </>
            ) : liveState.rateLimited ? (
              <>
                GDELT applique une limitation stricte de débit (1 requête par tranche de 5 secondes
                par IP). Cooldown en cours avant autorisation du prochain appel.
              </>
            ) : liveState.lastError ? (
              <>
                {liveState.lastError}. Vous pouvez consulter les données de démonstration ou relancer
                une tentative de requête.
              </>
            ) : (
              <>
                Flux en direct alimenté par <strong>GDELT DOC 2.0</strong>. Extraction des métadonnées
                publiques, assainissement anti-traceurs et déduplication automatique.
              </>
            )}
          </p>

          <div className="flex items-center justify-between text-[#bdc8d1] font-mono text-[11px] mb-3">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">
                sync_alt
              </span>
              {isOffline
                ? `${dispatches.length} dépêches en cache local · 0 paquet émis`
                : dataMode === 'demo'
                ? `${dispatches.length} dépêches synthétiques de test`
                : `${dispatches.length} dépêches reçues de GDELT`}
            </span>
            <span className="text-[#dae2fd]">
              {isOffline
                ? '0 ms (Local IDB)'
                : dataMode === 'demo'
                ? '0 ms (Mémoire locale)'
                : liveState.lastResponseTimeMs !== null
                ? `${liveState.lastResponseTimeMs} ms (GDELT)`
                : 'En attente'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#222a3d]/60 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] font-['Geist'] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[14px] ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                >
                  bolt
                </span>
                <span>
                  {isRefreshing
                    ? 'Requête en cours...'
                    : dataMode === 'live'
                    ? 'Actualiser via GDELT'
                    : 'Actualiser jeu démo'}
                </span>
              </button>

              <button
                onClick={onToggleDataMode}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#171f33] text-[#8ed5ff] hover:bg-[#222a3d] font-['Geist'] text-xs font-semibold transition-colors border border-[#222a3d]"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {dataMode === 'live' ? 'science' : 'rss_feed'}
                </span>
                <span>
                  {dataMode === 'live' ? 'Passer en Mode Démo' : 'Passer en GDELT Direct'}
                </span>
              </button>
            </div>

            <button
              onClick={onOpenDiagnostic}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-[#171f33] text-[#38bdf8] hover:bg-[#222a3d] font-['Geist'] text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span>Sondes & Faisabilité</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. Search & Control Bar */}
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

      {/* 3. Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="font-['Geist'] text-xs font-bold tracking-wider text-[#dae2fd] uppercase">
            {dataMode === 'live' ? 'Flux GDELT Direct' : 'Flux Démonstration'} ({filteredDispatches.length})
          </span>
          <span
            className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
              dataMode === 'live'
                ? 'bg-[#004965]/40 text-[#8ed5ff] border border-[#38bdf8]/40'
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            }`}
          >
            {dataMode === 'live' ? 'LIVE GDELT' : 'DÉMO SYNTHÉTIQUE'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#bdc8d1]">
          {liveState.lastFetchTime
            ? `Dernière synchro: ${liveState.lastFetchTime.toLocaleTimeString()}`
            : 'Synchronisation disponible'}
        </span>
      </div>

      {/* 4. Live Feed Dispatch Cards */}
      {filteredDispatches.length === 0 ? (
        <div className="bg-[#131b2e] rounded-xl p-8 flex flex-col items-center justify-center text-center border border-[#222a3d]">
          <span className="material-symbols-outlined text-[48px] text-[#87929a] mb-2">
            inbox
          </span>
          <p className="font-['Newsreader'] text-lg text-[#dae2fd] font-semibold mb-1">
            Aucune dépêche trouvée
          </p>
          <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] max-w-sm mb-4">
            {dataMode === 'live'
              ? 'Aucun résultat renvoyé par GDELT pour ces critères, ou limitation de débit en cours.'
              : 'Aucune dépêche ne correspond à votre filtre de recherche.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg bg-[#38bdf8] text-[#00354a] font-['Geist'] text-xs font-semibold"
            >
              Relancer la requête
            </button>
            {dataMode === 'live' && (
              <button
                onClick={onToggleDataMode}
                className="px-3 py-1.5 rounded-lg bg-[#222a3d] text-[#dae2fd] font-['Geist'] text-xs font-semibold"
              >
                Afficher le jeu démo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredDispatches.map((dispatch) => {
            const isSaved = favorites.includes(dispatch.id);

            return (
              <article
                key={dispatch.id}
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

                    {/* Explicit Mock vs Live Badge */}
                    {dispatch.isMock ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/25">
                        <span className="material-symbols-outlined text-[12px]">science</span>
                        <span>DÉMO</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#004965]/40 text-[#8ed5ff] font-mono text-[10px] font-bold border border-[#38bdf8]/30">
                        <span className="material-symbols-outlined text-[12px]">rss_feed</span>
                        <span>GDELT 2.0</span>
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

                {/* Day, Hour & Freshness Status Indicator */}
                <div className="pl-2 mb-1.5">
                  <FreshnessBanner
                    timestamp={dispatch.timestamp}
                    isMock={dispatch.isMock}
                    size="normal"
                  />
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

                {/* Visual Media if present */}
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
                  </div>
                )}

                {/* Market Metric pill if present */}
                {dispatch.marketMetric && (
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
                      GKG: #{dispatch.gkgId.slice(0, 10)}
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
            );
          })}
        </div>
      )}

      {/* 5. PWA Offline Telemetry Banner */}
      <footer className="mt-4 pt-2">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#131b2e] text-[#dae2fd] shadow-sm border border-[#222a3d]">
          <div className="w-9 h-9 rounded-full bg-[#8ed5ff]/10 flex items-center justify-center shrink-0 text-[#8ed5ff]">
            <span className="material-symbols-outlined text-[20px]">offline_pin</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-['Geist'] text-xs font-semibold text-[#8ed5ff]">
              Stockage Local Souverain (IndexedDB)
            </span>
            <span className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] leading-snug">
              {favorites.length} favori(s) stocké(s) localement. Vos données restent strictement
              confinées dans votre navigateur sans traçage ni analytics externe.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
