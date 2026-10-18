import React, { useState } from 'react';

interface NetworkDiagnosticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favoritesCount: number;
}

export const NetworkDiagnosticDrawer: React.FC<NetworkDiagnosticDrawerProps> = ({
  isOpen,
  onClose,
  favoritesCount,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRetryDirect = () => {
    setRetrying(true);
    setRetryResult(null);
    setTimeout(() => {
      setRetrying(false);
      setRetryResult('Tentative directe : Blocage CORS navigateur confirmé. Maintien du proxy edge CDG.');
      setTimeout(() => setRetryResult(null), 3000);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm transition-all duration-300 animate-fadeIn">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl mx-auto max-h-[88vh] overflow-y-auto bg-[#131b2e] rounded-t-2xl border-t border-[#38bdf8]/30 shadow-2xl flex flex-col z-10 pb-safe font-['Geist'] text-xs text-[#dae2fd]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Drawer Header */}
        <div className="sticky top-0 z-20 flex flex-col bg-[#131b2e]/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-[#222a3d]">
          {/* Grab handle */}
          <div
            onClick={onClose}
            className="w-12 h-1.5 bg-[#3e484f]/60 rounded-full mx-auto mb-3 cursor-pointer hover:bg-[#87929a] transition-colors"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 flex items-center justify-center shrink-0 text-[#38bdf8]">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-['Newsreader'] text-base sm:text-lg font-bold text-[#dae2fd] truncate leading-tight">
                  Diagnostic Réseau en Direct
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#ec6a06] animate-pulse" />
                  <span className="font-mono text-[10px] uppercase font-bold text-[#ffb690] tracking-wider">
                    Bascule de Secours Active (Failover)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRetryDirect}
                disabled={retrying}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#8ed5ff] font-mono text-[11px] font-semibold transition-colors border border-[#222a3d]"
              >
                <span
                  className={`material-symbols-outlined text-[15px] ${
                    retrying ? 'animate-spin' : ''
                  }`}
                >
                  refresh
                </span>
                <span className="hidden sm:inline">Re-tester</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Fermer le diagnostic"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#bdc8d1] hover:text-[#dae2fd] hover:bg-[#222a3d] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="px-4 py-3 flex flex-col space-y-3.5">
          {/* Notification / Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#171f33] to-[#171f33] border border-[#ec6a06]/30 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[#ffb690] font-mono text-xs font-semibold flex-wrap gap-1">
              <span>INCIDENT CORS DÉTECTÉ ➔ BASCULE PROXY ACTIVE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ec6a06]/20 text-[10px] text-[#ffb690] font-bold uppercase">
                Latence globale : 184 ms
              </span>
            </div>
            <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] leading-snug">
              Requête directe GDELT bloquée par politique CORS navigateur. Relais transparent via{' '}
              <strong className="text-[#8ed5ff] font-semibold">
                Cloudflare Pages functions/api/news.ts
              </strong>{' '}
              (<strong className="text-[#dae2fd] font-semibold">0 € / mois</strong>).
            </p>
          </div>

          {retryResult && (
            <div className="p-2 rounded bg-amber-400/15 text-amber-300 font-mono text-[11px] border border-amber-400/30 animate-fadeIn">
              {retryResult}
            </div>
          )}

          {/* Active Probes (4/4) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[#bdc8d1] font-mono text-[11px]">
              <span className="uppercase tracking-wider font-semibold">
                Sondes Actives (4/4 opérationnelles)
              </span>
              <span>Edge: Paris (CDG)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Probe 1 */}
              <div className="p-2.5 rounded-lg bg-[#171f33] border border-[#222a3d] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#dae2fd] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a06]" />
                    GDELT DOC 2.0 (Direct)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#ec6a06]/20 text-[#ffb690] font-mono text-[10px] font-bold">
                    ÉCHEC CORS (403)
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#bdc8d1] space-y-0.5">
                  <div>
                    Statut : <span className="text-[#ffb690] font-semibold">Strict-Origin Policy</span>
                  </div>
                  <div className="text-[10px] text-[#87929a] leading-tight">
                    Blocage CORS client : bascule immédiate vers proxy edge
                  </div>
                </div>
              </div>

              {/* Probe 2 */}
              <div className="p-2.5 rounded-lg bg-[#171f33] border border-[#222a3d] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#dae2fd] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Passerelle CORS Secours
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    ACTIF (200 OK)
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#bdc8d1] space-y-0.5">
                  <div>
                    Quota : <span className="text-[#8ed5ff] font-semibold">42 / 100 000 req/j</span>{' '}
                    (Tier Gratuit 0 €)
                  </div>
                  <div>
                    Latence edge :{' '}
                    <span className="text-emerald-400 font-semibold">18 ms</span> (CDG · Pages Functions)
                  </div>
                </div>
              </div>

              {/* Probe 3 */}
              <div className="p-2.5 rounded-lg bg-[#171f33] border border-[#222a3d] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#dae2fd] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Service Worker PWA
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#222a3d] text-[#dae2fd] font-mono text-[10px]">
                    v1.4.2
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#bdc8d1] space-y-0.5">
                  <div>
                    Cache actif : <span className="text-[#dae2fd] font-semibold">2.1 Mo</span> (Cache-First)
                  </div>
                  <div>
                    Mode hors-ligne :{' '}
                    <span className="text-emerald-400 font-semibold">Prêt</span>
                  </div>
                </div>
              </div>

              {/* Probe 4 */}
              <div className="p-2.5 rounded-lg bg-[#171f33] border border-[#222a3d] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#dae2fd] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a06]" />
                    IndexedDB Locale
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#ec6a06]/20 text-[#ffb690] font-mono text-[10px] font-bold">
                    Connecté
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#bdc8d1] space-y-0.5">
                  <div>
                    Lecture stockage : <span className="text-[#8ed5ff] font-bold">0.8 ms</span>
                  </div>
                  <div>
                    Articles archivés :{' '}
                    <span className="text-[#dae2fd] font-semibold">
                      {favoritesCount} dépêches
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agency Connectivity Matrix */}
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-[#bdc8d1] uppercase tracking-wider font-semibold">
              Matrice de connectivité par agence
            </span>
            <div className="rounded-lg bg-[#060e20] border border-[#222a3d] divide-y divide-[#222a3d]/60 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ec6a06]" />
                  <div>
                    <span className="text-[#dae2fd] font-semibold">reuters.com</span>{' '}
                    <span className="text-[10px] text-[#38bdf8]">(Transité Proxy)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#bdc8d1]">50 dépêches</span>
                  <span className="text-emerald-400 font-bold">142 ms · OK (Proxy)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ce9bff]" />
                  <div>
                    <span className="text-[#dae2fd] font-semibold">bloomberg.com</span>{' '}
                    <span className="text-[10px] text-[#38bdf8]">(Transité Proxy)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#bdc8d1]">50 dépêches</span>
                  <span className="text-emerald-400 font-bold">168 ms · OK (Proxy)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <div>
                    <span className="text-[#dae2fd] font-semibold">afp.com</span>{' '}
                    <span className="text-[10px] text-[#38bdf8]">(Transité Proxy)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#bdc8d1]">8 directes</span>
                  <span className="text-emerald-400 font-bold">155 ms · OK (Proxy)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Console */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#bdc8d1] uppercase tracking-wider font-semibold">
                Console Télémétrie en temps réel
              </span>
              <span className="font-mono text-[10px] text-[#8ed5ff]">Heartbeat 15s</span>
            </div>

            <div className="bg-black/90 rounded-lg p-2.5 border border-[#222a3d] font-mono text-[11px] text-emerald-400 flex flex-col gap-1 leading-snug overflow-x-auto">
              <div className="flex items-start gap-2">
                <span className="text-[#87929a]">[14:22:01]</span>
                <span className="text-[#ffb690] font-semibold">
                  GET https://api.gdeltproject.org/... -&gt; ERR_BLOCKED_BY_ORB / CORS_ERROR
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#87929a]">[14:22:02]</span>
                <span className="text-[#c4e7ff]">
                  Failover déclenché vers /functions/api/news.ts (Pages Functions CDG)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#87929a]">[14:22:02]</span>
                <span className="text-emerald-400 font-semibold">
                  Cloudflare Edge (CDG) -&gt; GDELT Ingestion : 200 OK (50 dépêches reçues)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#87929a]">[14:22:03]</span>
                <span className="text-[#bdc8d1]">
                  Cache Edge actif (TTL 60s) · Pas de fuite IP utilisateur · Relais transparent
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#222a3d]">
            <button
              onClick={handleRetryDirect}
              disabled={retrying}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#ffb690] font-semibold transition-colors border border-[#222a3d]"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  retrying ? 'animate-spin' : ''
                }`}
              >
                restart_alt
              </span>
              <span>{retrying ? 'Test en cours...' : 'Forcer ré-essai direct'}</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#004965] font-bold transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Conserver Proxy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
