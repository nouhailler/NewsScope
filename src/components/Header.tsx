import React from 'react';
import { ActiveTab, DataSourceMode, LiveFetchState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  favoritesCount: number;
  isOffline: boolean;
  onToggleOffline: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenDiagnostic: () => void;
  dataMode: DataSourceMode;
  onToggleDataMode: () => void;
  liveState: LiveFetchState;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  favoritesCount,
  isOffline,
  onToggleOffline,
  onRefresh,
  isRefreshing,
  onOpenDiagnostic,
  dataMode,
  onToggleDataMode,
  liveState,
}) => {
  const getSubTitle = () => {
    switch (activeTab) {
      case 'favoris':
        return 'Favoris Locaux';
      case 'filtres':
        return 'Filtres & Flux';
      case 'a-propos':
        return 'Audit & Méthodologie';
      case 'detail':
        return 'Dépêche Officielle';
      default:
        return 'Flux Direct';
    }
  };

  const getLatencyDisplay = () => {
    if (isOffline) return 'OFF-GRID (IDB)';
    if (dataMode === 'demo') return 'DÉMO: 0ms';
    if (liveState.rateLimited) return '429: COOLDOWN';
    if (liveState.lastResponseTimeMs !== null) return `GDELT: ${liveState.lastResponseTimeMs}ms`;
    return 'GDELT DOC 2.0';
  };

  const getStatusText = () => {
    if (isOffline) {
      return 'Mode hors-ligne souverain • Cache IndexedDB vérifié';
    }
    if (dataMode === 'demo') {
      return 'Mode Démonstration • Dépêches synthétiques fictives';
    }
    if (liveState.isLoading) {
      return 'Interrogation en cours de GDELT DOC 2.0...';
    }
    if (liveState.rateLimited) {
      return liveState.lastError || 'GDELT 429 : Cooldown actif (1 req / 5s)';
    }
    if (liveState.lastError) {
      return `Alerte connecteur : ${liveState.lastError}`;
    }
    return 'Liaison directe GDELT DOC 2.0 opérationnelle';
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#0b1326]/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.35)] border-b border-[#222a3d]/60">
      <div className="h-24 px-4 sm:px-6 flex flex-col justify-between py-2 max-w-7xl mx-auto">
        {/* Top Brand Bar */}
        <div className="flex items-center justify-between gap-3 h-11">
          {/* Logo & Subtitle */}
          <button
            onClick={() => onTabChange('flux-direct')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#222a3d] text-[#38bdf8] font-bold shadow-sm group-hover:bg-[#2d3449] transition-colors">
              <span className="material-symbols-outlined text-[18px]">terminal</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Newsreader'] text-[19px] tracking-tight text-[#dae2fd] font-semibold leading-none group-hover:text-[#8ed5ff] transition-colors">
                NewsScope
              </span>
              <span className="font-['Geist'] text-[10px] text-[#bdc8d1] uppercase tracking-widest mt-0.5">
                {getSubTitle()}
              </span>
            </div>
          </button>

          {/* Central Mode & Live Status Selector */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Live vs Demo Toggle */}
            <button
              onClick={onToggleDataMode}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                dataMode === 'live'
                  ? 'bg-[#004965]/40 text-[#8ed5ff] border-[#38bdf8]/50 hover:bg-[#004965]/60'
                  : 'bg-amber-500/15 text-amber-300 border-amber-400/40 hover:bg-amber-500/25'
              }`}
              title="Basculer entre l'API GDELT en direct et le jeu de données démo"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dataMode === 'live' ? 'bg-[#38bdf8] animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{dataMode === 'live' ? 'SOURCE : GDELT EN DIRECT' : 'SOURCE : MODE DÉMO'}</span>
            </button>

            {/* Offline indicator badge */}
            {isOffline && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30">
                OFFLINE
              </span>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Data Mode Switch on mobile */}
            <button
              onClick={onToggleDataMode}
              className="sm:hidden px-2 py-1 rounded bg-[#171f33] text-xs font-mono text-[#8ed5ff] border border-[#222a3d]"
              title="Basculer Direct / Démo"
            >
              {dataMode === 'live' ? 'LIVE' : 'DÉMO'}
            </button>

            {/* Offline Simulation Toggle */}
            <button
              onClick={onToggleOffline}
              aria-label="Basculer le mode hors-ligne"
              className={`h-9 px-2.5 flex items-center gap-1 rounded-lg text-xs font-semibold font-mono transition-colors ${
                isOffline
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#171f33] text-[#bdc8d1] hover:text-[#8ed5ff]'
              }`}
              title={isOffline ? 'Désactiver le mode hors-ligne' : 'Simuler une coupure réseau'}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isOffline ? 'cloud_off' : 'wifi'}
              </span>
              <span className="hidden md:inline">{isOffline ? 'Offline' : 'Online'}</span>
            </button>

            {/* Refresh Dispatches (Real Call) */}
            <button
              onClick={onRefresh}
              aria-label="Rafraîchir les dépêches"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#171f33] text-[#bdc8d1] hover:text-[#8ed5ff] hover:bg-[#222a3d] transition-colors"
              title={dataMode === 'live' ? 'Lancer requête réelle GDELT' : 'Réinitialiser jeu démo'}
            >
              <span
                className={`material-symbols-outlined text-[19px] ${
                  isRefreshing ? 'animate-spin text-[#8ed5ff]' : ''
                }`}
              >
                sync
              </span>
            </button>

            {/* Saved Dispatches Badge Button */}
            <button
              onClick={() => onTabChange('favoris')}
              aria-label="Dépêches sauvegardées"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#171f33] text-[#bdc8d1] hover:text-[#8ed5ff] hover:bg-[#222a3d] transition-colors"
              title="Voir mes favoris locaux"
            >
              <span className="material-symbols-outlined text-[19px]">bookmark</span>
              <span className="absolute -top-1 -right-1 min-w-[17px] h-4 px-1 rounded-full bg-[#ec6a06] text-[#ffdbca] font-mono text-[10px] flex items-center justify-center font-bold shadow-sm">
                {favoritesCount}
              </span>
            </button>

            {/* Network Probes Trigger */}
            <button
              onClick={onOpenDiagnostic}
              aria-label="Diagnostic réseau"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#171f33] text-[#8ed5ff] hover:bg-[#222a3d] transition-colors"
              title="Sondes & Diagnostic Réseau"
            >
              <span className="material-symbols-outlined text-[19px]">hub</span>
            </button>

            {/* User Profile */}
            <div className="w-8 h-8 rounded-full bg-[#8ed5ff] flex items-center justify-center text-[#00354a] font-bold text-xs ml-1 shadow-sm">
              <span className="material-symbols-outlined text-[17px]">person</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry / Ingestion Status Strip (Honest Metrics) */}
        <div className="flex items-center justify-between bg-[#060e20]/80 px-3 py-1 rounded text-[11px] font-mono border border-[#222a3d]/40">
          <div className="flex items-center gap-2 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isOffline
                    ? 'bg-amber-400'
                    : dataMode === 'demo'
                    ? 'bg-amber-400'
                    : liveState.lastError
                    ? 'bg-rose-400'
                    : 'bg-[#38bdf8]'
                } opacity-75`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOffline
                    ? 'bg-amber-400'
                    : dataMode === 'demo'
                    ? 'bg-amber-400'
                    : liveState.lastError
                    ? 'bg-rose-400'
                    : 'bg-[#38bdf8]'
                }`}
              />
            </span>
            <span
              className={`font-semibold tracking-wider uppercase truncate ${
                isOffline
                  ? 'text-amber-300'
                  : dataMode === 'demo'
                  ? 'text-amber-300'
                  : liveState.lastError
                  ? 'text-rose-300'
                  : 'text-[#38bdf8]'
              }`}
            >
              {getStatusText()}
            </span>
          </div>
          <button
            onClick={onOpenDiagnostic}
            className="flex items-center gap-2 text-[#bdc8d1] hover:text-[#8ed5ff] shrink-0 ml-2"
          >
            <span className="font-mono">{getLatencyDisplay()}</span>
            <span className="hidden sm:inline text-xs text-[#38bdf8] underline font-sans">
              Diagnostic
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
