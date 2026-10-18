/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Dispatch, FilterState } from './types';
import { INITIAL_DISPATCHES } from './data/mockDispatches';
import {
  getStoredFavorites,
  saveStoredFavorites,
  toggleFavoriteId,
  getOfflineMode,
  setOfflineMode,
} from './utils/storage';
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
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
    batchLimit: 50,
    activeTopics: ['Banques Centrales & Taux', 'Tech & IA'],
    urlSanitization: true,
  });

  // Keep state synced with localStorage
  const handleToggleFavorite = (id: string) => {
    const updated = toggleFavoriteId(id);
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 850);
  };

  const handleSelectDispatch = (id: string) => {
    setSelectedDispatchId(id);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const currentDispatch =
    INITIAL_DISPATCHES.find((d) => d.id === selectedDispatchId) || INITIAL_DISPATCHES[0];

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
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full pt-28 pb-16 min-h-screen">
        {activeTab === 'flux-direct' && (
          <FluxDirectView
            dispatches={INITIAL_DISPATCHES}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectDispatch={handleSelectDispatch}
            onOpenDiagnostic={() => setActiveModal('network-diagnostic')}
            isOffline={isOffline}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
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
            allDispatches={INITIAL_DISPATCHES}
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
            onUpdateFilters={setFilters}
            onApply={() => {
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
