/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, Dispatch, FilterState, DataSourceMode, LiveFetchState } from './types';
import { INITIAL_DISPATCHES } from './data/mockDispatches';
import {
  getStoredFavorites,
  saveStoredFavorites,
  toggleFavoriteId,
  getOfflineMode,
  setOfflineMode,
  getDataMode,
  setDataMode,
} from './utils/storage';
import {
  getAllIndexedDBFavorites,
  getDispatchFromIndexedDB,
  getAllCachedDispatches,
} from './utils/indexedDB';
import { fetchLiveGdeltDispatches } from './services/gdeltService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FluxDirectView } from './components/FluxDirectView';
import { DetailView } from './components/DetailView';
import { FavorisView } from './components/FavorisView';
import { FiltresView } from './components/FiltresView';
import { AProposView } from './components/AProposView';
import { JsonInspectorModal } from './components/JsonInspectorModal';
import { NetworkDiagnosticDrawer } from './components/NetworkDiagnosticDrawer';
import { AuditModal } from './components/AuditModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('flux-direct');
  const [selectedDispatchId, setSelectedDispatchId] = useState<string>('doc_reuters_88c2f1');
  const [favorites, setFavorites] = useState<string[]>(getStoredFavorites());
  const [isOffline, setIsOfflineState] = useState<boolean>(getOfflineMode());
  const [dataMode, setDataModeState] = useState<DataSourceMode>(getDataMode());
  const [liveDispatches, setLiveDispatches] = useState<Dispatch[]>([]);
  const [cachedDispatches, setCachedDispatches] = useState<Dispatch[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [liveState, setLiveState] = useState<LiveFetchState>({
    isLoading: false,
    lastFetchTime: null,
    lastResponseStatus: null,
    lastResponseTimeMs: null,
    lastError: null,
    cooldownUntil: null,
  });

  const [activeModal, setActiveModal] = useState<
    'json-inspector' | 'network-diagnostic' | 'audit' | null
  >(null);

  const [filters, setFilters] = useState<FilterState>({
    agencies: { reuters: true, bloomberg: true, afp: true },
    excludeThirdParty: true,
    keyword: '',
    timeWindow: '24h',
    sortMode: 'recent',
    startDate: '2025-03-26 00:00',
    endDate: '2025-03-27 15:42',
    language: 'FR',
    batchLimit: 25,
    activeTopics: ['Banques Centrales & Taux', 'Tech & IA'],
    urlSanitization: true,
  });

  // Load IndexedDB favorites and all cached dispatches on mount
  useEffect(() => {
    Promise.all([
      getAllIndexedDBFavorites(),
      getAllCachedDispatches(),
    ]).then(([idbFavorites, idbDispatches]) => {
      if (idbFavorites.length > 0) {
        setFavorites(idbFavorites);
        saveStoredFavorites(idbFavorites);
      }
      if (idbDispatches.length > 0) {
        setCachedDispatches(idbDispatches);
      }
    }).catch(console.warn);
  }, []);

  // Real fetch from GDELT DOC 2.0
  const executeLiveFetch = useCallback(async (activeFilters: FilterState) => {
    if (isOffline) {
      setLiveState((prev) => ({
        ...prev,
        lastError: 'Mode hors-ligne actif. Interrogation réseau suspendue.',
      }));
      return;
    }

    setIsRefreshing(true);
    setLiveState((prev) => ({
      ...prev,
      isLoading: true,
      lastError: null,
    }));

    try {
      const res = await fetchLiveGdeltDispatches(activeFilters);
      setLiveState({
        isLoading: false,
        lastFetchTime: new Date(),
        lastResponseStatus: res.httpStatus,
        lastResponseTimeMs: res.latencyMs,
        lastError: res.error,
        rateLimited: res.rateLimited,
        cooldownUntil: res.rateLimited ? Date.now() + 5000 : null,
      });

      if (res.success && res.dispatches.length > 0) {
        setLiveDispatches(res.dispatches);
        if (res.dispatches[0]) {
          setSelectedDispatchId(res.dispatches[0].id);
        }
      }
    } catch (err: any) {
      setLiveState((prev) => ({
        ...prev,
        isLoading: false,
        lastError: err.message || 'Erreur inattendue lors de la requête GDELT',
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, [isOffline]);

  // Initial fetch if in live mode on mount
  useEffect(() => {
    if (dataMode === 'live' && !isOffline) {
      executeLiveFetch(filters);
    }
  }, [dataMode, isOffline, executeLiveFetch, filters]);

  // Favorite toggle synced with IndexedDB
  const handleToggleFavorite = (id: string) => {
    const allKnown = [...liveDispatches, ...INITIAL_DISPATCHES, ...cachedDispatches];
    const target = allKnown.find((d) => d.id === id);
    const updated = toggleFavoriteId(id, target);
    setFavorites([...updated]);
  };

  const handlePurgeAllFavorites = () => {
    saveStoredFavorites([]);
    setFavorites([]);
  };

  const handleToggleOffline = () => {
    const next = !isOffline;
    setIsOfflineState(next);
    setOfflineMode(next);
  };

  const handleToggleDataMode = () => {
    const next: DataSourceMode = dataMode === 'live' ? 'demo' : 'live';
    setDataModeState(next);
    setDataMode(next);
    if (next === 'live' && liveDispatches.length === 0 && !isOffline) {
      executeLiveFetch(filters);
    }
  };

  const handleRefresh = () => {
    if (dataMode === 'live') {
      executeLiveFetch(filters);
    } else {
      // Refreshing synthetic data
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
      }, 400);
    }
  };

  const handleSelectDispatch = (id: string) => {
    setSelectedDispatchId(id);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine which dispatches to feed the views — STRICT SEPARATION (NO SILENT FALLBACKS)
  const activeDispatches: Dispatch[] = React.useMemo(() => {
    if (isOffline) {
      // In offline mode: ONLY articles actually preserved in IndexedDB
      return cachedDispatches;
    }
    if (dataMode === 'live') {
      // In live mode: ONLY articles actually fetched from GDELT DOC 2.0
      return liveDispatches;
    }
    // In demo mode: ONLY synthetic demonstration data
    return INITIAL_DISPATCHES;
  }, [isOffline, dataMode, liveDispatches, cachedDispatches]);

  // Current selected dispatch for detail view
  const currentDispatch =
    activeDispatches.find((d) => d.id === selectedDispatchId) ||
    activeDispatches[0] ||
    INITIAL_DISPATCHES[0];

  // Combined dispatches pool for favoris view
  const allDispatchesPool = React.useMemo(() => {
    const map = new Map<string, Dispatch>();
    INITIAL_DISPATCHES.forEach((d) => map.set(d.id, d));
    cachedDispatches.forEach((d) => map.set(d.id, d));
    liveDispatches.forEach((d) => map.set(d.id, d));
    return Array.from(map.values());
  }, [liveDispatches, cachedDispatches]);

  // Keyboard shortcut support (ESC closes modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else if (activeTab === 'detail') {
          setActiveTab('flux-direct');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, activeTab]);

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-['Source_Serif_4'] flex flex-col selection:bg-[#38bdf8] selection:text-[#004965]">
      {/* Fixed Application Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenDiagnostic={() => setActiveModal('network-diagnostic')}
        dataMode={dataMode}
        onToggleDataMode={handleToggleDataMode}
        liveState={liveState}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full pt-28 pb-16 min-h-screen">
        {activeTab === 'flux-direct' && (
          <FluxDirectView
            dispatches={activeDispatches}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectDispatch={handleSelectDispatch}
            onOpenDiagnostic={() => setActiveModal('network-diagnostic')}
            isOffline={isOffline}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            dataMode={dataMode}
            onToggleDataMode={handleToggleDataMode}
            liveState={liveState}
          />
        )}

        {activeTab === 'detail' && (
          <DetailView
            dispatch={currentDispatch}
            isFavorite={favorites.includes(currentDispatch.id)}
            onToggleFavorite={() => handleToggleFavorite(currentDispatch.id)}
            onBack={() => setActiveTab('flux-direct')}
            onOpenJsonInspector={() => setActiveModal('json-inspector')}
            onGoToFavorites={() => setActiveTab('favoris')}
          />
        )}

        {activeTab === 'favoris' && (
          <FavorisView
            allDispatches={allDispatchesPool}
            favoriteIds={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectDispatch={handleSelectDispatch}
            onOpenJsonInspector={() => setActiveModal('json-inspector')}
            onPurgeAll={handlePurgeAllFavorites}
          />
        )}

        {activeTab === 'filtres' && (
          <FiltresView
            filters={filters}
            onUpdateFilters={(updated) => {
              setFilters(updated);
              if (dataMode === 'live' && !isOffline) {
                executeLiveFetch(updated);
              }
            }}
            onApply={() => {
              if (dataMode === 'live' && !isOffline) {
                executeLiveFetch(filters);
              }
              setActiveTab('flux-direct');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'a-propos' && (
          <AProposView
            onOpenAuditModal={() => setActiveModal('audit')}
            favoritesCount={favorites.length}
          />
        )}
      </main>

      {/* Fixed Bottom Tab Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
      />

      {/* Modals & Drawers */}
      {activeModal === 'json-inspector' && (
        <JsonInspectorModal
          dispatch={currentDispatch}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'network-diagnostic' && (
        <NetworkDiagnosticDrawer
          isOpen={true}
          onClose={() => setActiveModal(null)}
          favoritesCount={favorites.length}
        />
      )}

      {activeModal === 'audit' && (
        <AuditModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
