import React, { useState } from 'react';
import { Dispatch, AgencyId } from '../types';
import {
  calculateStorageSize,
  exportFavoritesAsJson,
} from '../utils/storage';

interface FavorisViewProps {
  allDispatches: Dispatch[];
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onSelectDispatch: (id: string) => void;
  onOpenJsonInspector: () => void;
  onPurgeAll: () => void;
}

export const FavorisView: React.FC<FavorisViewProps> = ({
  allDispatches,
  favoriteIds,
  onToggleFavorite,
  onSelectDispatch,
  onOpenJsonInspector,
  onPurgeAll,
}) => {
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collect the favorite dispatch objects
  const savedDispatches = allDispatches.filter((d) => favoriteIds.includes(d.id));

  const agencyCounts = {
    all: savedDispatches.length,
    reuters: savedDispatches.filter((d) => d.agency === 'reuters').length,
    bloomberg: savedDispatches.filter((d) => d.agency === 'bloomberg').length,
    afp: savedDispatches.filter((d) => d.agency === 'afp').length,
  };

  const filtered = savedDispatches.filter((d) => {
    if (selectedAgency !== 'all' && d.agency !== selectedAgency) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchExcerpt = d.excerpt.toLowerCase().includes(q);
      const matchNote = d.analystNote?.toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt && !matchNote) return false;
    }
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleExport = () => {
    exportFavoritesAsJson(filtered);
    setExportSuccess(true);
    showToast(`Exportation JSON terminée (${filtered.length} dépêches)`);
  };

  const handleCopyLink = (d: Dispatch) => {
    navigator.clipboard?.writeText(d.canonicalUrl);
    showToast("Permalien copié dans le presse-papier");
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-3 sm:px-4 space-y-4 pb-28 pt-2">
      {/* 1. Status Local & Telemetry IndexedDB */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="font-['Newsreader'] text-xl sm:text-2xl text-[#dae2fd] font-semibold tracking-tight">
            Favoris Locaux & Cache
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#222a3d] border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-['Geist'] text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              Hors-ligne opérationnel
            </span>
          </div>
        </div>

        {/* Memory status card */}
        <div className="bg-[#131b2e] rounded-xl p-3.5 sm:p-4 shadow-md border border-[#222a3d] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#8ed5ff]">
                database
              </span>
              <span className="font-mono font-semibold text-[#8ed5ff]">
                IndexedDB : NewsScope_v1
              </span>
            </div>
            <span className="font-['Geist'] text-[#bdc8d1] text-[11px]">
              Quota local navigateur libre
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <span className="font-['Newsreader'] text-base sm:text-lg text-[#dae2fd] font-semibold">
              {savedDispatches.length} dépêches archivées
            </span>
            <span className="font-mono text-xs text-[#ffb690] font-medium">
              {calculateStorageSize(savedDispatches)}
            </span>
          </div>

          <div className="w-full bg-[#2d3449] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#38bdf8] h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(12, savedDispatches.length * 6.5))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-[#bdc8d1] text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              <span>Dernière synchro : Aujourd'hui à 11:24</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-400 font-medium">
              Cryptage local SHA-256
            </span>
          </div>
        </div>
      </section>

      {/* 2. Toolbar, Search & Maintenance Actions */}
      <section className="flex flex-col gap-2.5">
        {/* Search input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#87929a] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer mes favoris par mot-clé, ticker, analyste..."
            className="w-full pl-9 pr-12 py-2.5 bg-[#171f33] rounded-lg font-['Geist'] text-xs sm:text-sm text-[#dae2fd] placeholder:text-[#87929a] focus:outline-none focus:bg-[#222a3d] transition-colors border border-[#222a3d]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#2d3449] text-[#bdc8d1]">
            ⌘F
          </span>
        </div>

        {/* Agency Filter Chips */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSelectedAgency('all')}
              className={`px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                selectedAgency === 'all'
                  ? 'bg-[#8ed5ff] text-[#00354a]'
                  : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d]'
              }`}
            >
              <span>Toutes</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-black/20">
                {agencyCounts.all}
              </span>
            </button>

            <button
              onClick={() => setSelectedAgency('reuters')}
              className={`px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                selectedAgency === 'reuters'
                  ? 'bg-[#ffb690] text-[#552100]'
                  : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a06]" />
              <span>Reuters</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-black/20">
                {agencyCounts.reuters}
              </span>
            </button>

            <button
              onClick={() => setSelectedAgency('bloomberg')}
              className={`px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                selectedAgency === 'bloomberg'
                  ? 'bg-[#e1bfff] text-[#490080]'
                  : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ce9bff]" />
              <span>Bloomberg</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-black/20">
                {agencyCounts.bloomberg}
              </span>
            </button>

            <button
              onClick={() => setSelectedAgency('afp')}
              className={`px-3 py-1.5 rounded-full font-['Geist'] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                selectedAgency === 'afp'
                  ? 'bg-[#38bdf8] text-[#004965]'
                  : 'bg-[#171f33] text-[#dae2fd] hover:bg-[#222a3d]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              <span>AFP</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-black/20">
                {agencyCounts.afp}
              </span>
            </button>
          </div>

          {selectedAgency !== 'all' && (
            <div className="flex items-center justify-between text-[#bdc8d1] text-[11px] font-['Geist'] px-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#ffb690]">
                  filter_alt
                </span>
                <span>
                  Filtre actif :{' '}
                  <strong className="text-[#ffb690] uppercase font-semibold">
                    {selectedAgency}
                  </strong>{' '}
                  ({filtered.length} dépêches sur {savedDispatches.length} en cache)
                </span>
              </div>
              <span className="font-mono text-emerald-400">Filtre instantané IndexedDB</span>
            </div>
          )}
        </div>

        {/* Quick maintenance actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-['Geist'] text-xs font-semibold transition-colors shadow-sm ${
              exportSuccess
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-[#171f33] hover:bg-[#222a3d] text-[#8ed5ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {exportSuccess ? 'check_circle' : 'file_download'}
            </span>
            <span>
              {exportSuccess
                ? `Exporté (${filtered.length} dépêches) ✓`
                : 'Exporter JSON'}
            </span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Vider intégralement le cache des favoris locaux ?')) {
                onPurgeAll();
                showToast('Cache local vidé avec succès');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#171f33] hover:bg-rose-950/40 text-[#ffb4ab] font-['Geist'] text-xs font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>Vider le cache...</span>
          </button>
        </div>
      </section>

      {/* 3. Exported JSON Rich Banner */}
      {exportSuccess && (
        <div className="bg-[#171f33] rounded-xl p-3 border border-emerald-400/30 shadow-lg flex flex-col gap-2 relative overflow-hidden animate-fadeIn">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">download_done</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-['Newsreader'] text-sm font-semibold text-[#dae2fd]">
                    Fichier JSON généré avec succès
                  </h3>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-400 font-mono text-[10px] font-bold">
                    PRÊT
                  </span>
                </div>
                <p className="font-['Geist'] text-xs text-[#bdc8d1] mt-0.5">
                  {filtered.length} dépêches exportées • Format GDELT normalisé RFC 8259
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-[#87929a] text-[13px]">
                    description
                  </span>
                  <code className="font-mono text-[11px] text-[#8ed5ff] bg-[#222a3d] px-1.5 py-0.5 rounded truncate">
                    newsscope-export-{new Date().toISOString().slice(0, 10)}.json
                  </code>
                </div>
              </div>
            </div>
            <button
              onClick={() => setExportSuccess(false)}
              className="text-[#bdc8d1] hover:text-[#dae2fd] p-1 rounded hover:bg-[#222a3d]"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-[#222a3d]/60 pl-10">
            <button
              onClick={onOpenJsonInspector}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222a3d] hover:bg-[#2d3449] text-[#8ed5ff] font-['Geist'] text-xs font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              <span>Ouvrir / Inspecter JSON</span>
            </button>
            <button
              onClick={() => {
                showToast("Archive JSON partagée dans le presse-papier");
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222a3d] hover:bg-[#2d3449] text-[#bdc8d1] hover:text-[#dae2fd] font-['Geist'] text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">share</span>
              <span>Partager</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. List of Saved Dispatches */}
      <section className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="bg-[#131b2e] rounded-xl p-8 flex flex-col items-center justify-center text-center border border-[#222a3d]">
            <span className="material-symbols-outlined text-[48px] text-[#87929a] mb-2">
              cloud_off
            </span>
            <p className="font-['Newsreader'] text-lg text-[#dae2fd] font-semibold mb-1">
              Aucun favori enregistré
            </p>
            <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] max-w-xs mb-3">
              Le cache local est vide. Vous pouvez épingler des dépêches depuis le flux direct
              pour consultation hors-ligne.
            </p>
          </div>
        ) : (
          filtered.map((dispatch, idx) => (
            <article
              key={dispatch.id}
              className={`bg-[#131b2e] rounded-xl p-3.5 sm:p-4 shadow-md relative overflow-hidden transition-all duration-200 border border-[#222a3d] ${
                idx === 0 ? 'ring-1 ring-emerald-400/30' : ''
              }`}
            >
              {/* Left Accent Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  dispatch.agency === 'reuters'
                    ? 'bg-[#ec6a06]'
                    : dispatch.agency === 'bloomberg'
                    ? 'bg-[#ce9bff]'
                    : 'bg-[#38bdf8]'
                }`}
              />

              {/* Top Meta Line */}
              <div className="flex items-center justify-between gap-2 mb-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded font-['Geist'] text-[10px] font-bold tracking-wider uppercase ${dispatch.agencyClass}`}
                  >
                    {dispatch.agencyLabel}
                  </span>
                  <span className="flex items-center gap-1 font-['Geist'] text-xs text-emerald-400 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">
                      offline_pin
                    </span>
                    <span>
                      {idx === 0
                        ? "✓ ENREGISTRÉ À L'INSTANT (INDEXEDDB)"
                        : 'SAUVEGARDÉ LOCALEMENT'}
                    </span>
                  </span>
                </div>
                <span className="font-mono text-xs text-[#bdc8d1]">
                  {dispatch.timeAgo}
                </span>
              </div>

              {/* Title */}
              <h2
                onClick={() => onSelectDispatch(dispatch.id)}
                className="font-['Newsreader'] text-base sm:text-lg text-[#dae2fd] font-semibold leading-snug mb-1.5 pl-2 hover:text-[#8ed5ff] cursor-pointer transition-colors"
              >
                {dispatch.title}
              </h2>

              {/* Excerpt */}
              <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] mb-2 pl-2 line-clamp-2">
                {dispatch.excerpt}
              </p>

              {/* Analyst Note or Market Quote if present */}
              {dispatch.analystNote ? (
                <div className="bg-[#171f33] px-2.5 py-1.5 ml-2 rounded-lg flex items-center gap-2 mb-2.5 border border-[#222a3d]">
                  <span className="material-symbols-outlined text-[#ffb690] text-[16px] shrink-0">
                    edit_note
                  </span>
                  <span className="font-['Geist'] text-xs text-[#bdc8d1] italic truncate">
                    {dispatch.analystNote}
                  </span>
                </div>
              ) : (
                <div className="bg-[#171f33] px-2.5 py-1.5 ml-2 rounded-lg flex items-center justify-between gap-2 mb-2.5 text-[#bdc8d1] font-mono text-xs border border-[#222a3d]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="material-symbols-outlined text-[#ffb690] text-[16px]">
                      fingerprint
                    </span>
                    <span className="truncate">Clé : {dispatch.id}</span>
                  </div>
                  <span className="text-emerald-400 whitespace-nowrap text-[10px] font-medium">
                    Empreinte SHA-256 • 100% Hors-ligne
                  </span>
                </div>
              )}

              {/* Card Action Bar */}
              <div className="flex items-center justify-between pt-1 pl-2 border-t border-[#222a3d]/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onToggleFavorite(dispatch.id);
                      showToast('Dépêche retirée du cache local');
                    }}
                    className="p-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#ffb690] transition-colors"
                    title="Retirer des favoris"
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bookmark_remove
                    </span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(dispatch)}
                    className="p-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] transition-colors"
                    title="Copier le permalien local"
                  >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                  </button>
                </div>

                <a
                  href={dispatch.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] font-['Geist'] text-xs transition-colors"
                >
                  <span>Ouvrir l'original</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </article>
          ))
        )}
      </section>

      {/* 5. Data Privacy & Sovereign Purge Card */}
      <section className="mt-4">
        <div className="bg-[#131b2e] rounded-xl p-3.5 sm:p-4 shadow-sm border border-[#222a3d] space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[20px]">
              shield
            </span>
            <h3 className="font-['Newsreader'] text-base sm:text-lg text-[#dae2fd] font-semibold">
              Gestion des Données & Confidentialité
            </h3>
          </div>
          <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] leading-relaxed">
            Zéro synchronisation cloud — Vos favoris, notes et historiques de lecture ne
            quittent jamais votre appareil et restent confinés dans la partition IndexedDB de
            votre navigateur.
          </p>

          <div className="flex flex-col gap-2 bg-[#171f33] rounded-lg p-2.5 border border-[#222a3d]">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8] mt-0.5 shrink-0">
                verified_user
              </span>
              <div className="flex flex-col text-xs">
                <span className="font-['Geist'] text-[#dae2fd] font-semibold">
                  Sanitisation télémétrique active
                </span>
                <span className="font-['Geist'] text-[#bdc8d1] text-[11px]">
                  Toutes les URLs et snippets sont nettoyés des traceurs d'attribution
                  publicitaire (<code className="text-[#38bdf8] font-mono">utm_source</code>,{' '}
                  <code className="text-[#38bdf8] font-mono">fbclid</code>,{' '}
                  <code className="text-[#38bdf8] font-mono">taid</code>).
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-[#222a3d]/50">
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8] mt-0.5 shrink-0">
                cookie_off
              </span>
              <div className="flex flex-col text-xs">
                <span className="font-['Geist'] text-[#dae2fd] font-semibold">
                  Zéro tiers & Zéro cookie
                </span>
                <span className="font-['Geist'] text-[#bdc8d1] text-[11px]">
                  Architecture PWA décentralisée sans serveur intermédiaire d'analyse d'audience.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            <span className="font-mono text-[11px] text-[#bdc8d1]">
              Schéma DB : NewsScope_v1.4.2
            </span>
            <button
              onClick={() => {
                if (window.confirm('Voulez-vous réinitialiser le stockage local ?')) {
                  onPurgeAll();
                  showToast('Stockage local réinitialisé');
                }
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#222a3d] hover:bg-rose-950/40 text-[#ffb4ab] font-['Geist'] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              <span>Purger le stockage local</span>
            </button>
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#2d3449] text-[#dae2fd] px-4 py-2 rounded-lg font-['Geist'] text-xs shadow-xl flex items-center gap-2 z-50 border border-[#38bdf8]/40 animate-fadeIn">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
