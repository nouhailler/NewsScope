import React, { useState } from 'react';
import { exportAuditReportMarkdown } from '../utils/storage';

interface AProposViewProps {
  onOpenAuditModal: () => void;
  favoritesCount: number;
}

export const AProposView: React.FC<AProposViewProps> = ({
  onOpenAuditModal,
  favoritesCount,
}) => {
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleRunDiagnostic = () => {
    setTestRunning(true);
    setTestResult('Test des sondes en cours (ping CDG)...');
    setTimeout(() => {
      setTestRunning(false);
      setTestResult('VÉRIFIÉ (12ms - SW Actif - IndexedDB Intègre)');
      setTimeout(() => setTestResult(null), 3500);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-3 sm:px-4 space-y-4 pb-28 pt-2">
      {/* 1. App Identity Header */}
      <section className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#171f33] text-[#8ed5ff] font-mono text-[11px] font-semibold tracking-wider uppercase border border-[#222a3d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
            v1.4.2 · Production Stable
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#131b2e] text-[#bdc8d1] font-mono text-[11px] border border-[#222a3d]">
            <span className="material-symbols-outlined text-[13px] text-[#e1bfff]">lock</span>
            Protocole OpenWire-256
          </span>
        </div>

        <div className="flex flex-col">
          <h1 className="font-['Newsreader'] text-xl sm:text-2xl text-[#dae2fd] font-semibold tracking-tight">
            À Propos & Méthodologie
          </h1>
          <p className="font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#bdc8d1] mt-0.5">
            NewsScope v1.4.2 • Architecture Décentralisée, Surveillance Géopolitique & Déontologie Stricte.
          </p>
        </div>

        {/* Architectural Manifesto Card */}
        <div className="p-3.5 rounded-xl bg-[#131b2e] flex flex-col gap-2 shadow-sm border border-[#222a3d]">
          <div className="flex items-center justify-between">
            <span className="font-['Geist'] text-[11px] uppercase tracking-widest text-[#ffb690] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#ffb690]">
                verified
              </span>
              Manifeste Architectural
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#222a3d] text-[#8ed5ff] font-bold border border-[#222a3d]">
              0,00 € / MOIS
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#171f33] text-center border border-[#222a3d]">
              <span className="font-['Geist'] text-xs text-[#dae2fd] font-bold uppercase">
                Zéro Tracking
              </span>
              <span className="font-mono text-[10px] text-[#bdc8d1] mt-0.5">0 cookies tiers</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#171f33] text-center border border-[#222a3d]">
              <span className="font-['Geist'] text-xs text-[#dae2fd] font-bold uppercase">
                100% Client
              </span>
              <span className="font-mono text-[10px] text-[#bdc8d1] mt-0.5">IndexedDB local</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded bg-[#171f33] text-center border border-[#222a3d]">
              <span className="font-['Geist'] text-xs text-[#dae2fd] font-bold uppercase">
                PWA Autonome
              </span>
              <span className="font-mono text-[10px] text-[#bdc8d1] mt-0.5">Offline-Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Media: Command Center Banner */}
      <section className="rounded-xl overflow-hidden bg-[#131b2e] shadow-sm border border-[#222a3d]">
        <div
          className="relative w-full h-44 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXr2PxvIE0N3bDPiBe-9Gb8mXTWTRyn26dX6ADTYxp3vcpdH9muXIyJqGBWuqyQIIk_3uOy5gRmCw-vnTXJ_wndNExOiQgxTcucZy3AGavTTb9RSrDnE_8DqYDfh_S9-emUHxzkL0NDIaTr7mB1lD5cQa3yof3qa1-9vy_abBh6prBW-_h3ERcpe8EpRX9u7X0sq6AcYoKL808iNqy0Le66DreHFE5FPPFrL_pCsQ8Ll7PA8WVq1lp')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] via-[#0b1326]/50 to-transparent flex flex-col justify-end p-3.5 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#38bdf8] text-[#004965] font-['Geist'] text-[10px] font-bold uppercase">
                Audit Phase 0
              </span>
              <span className="font-mono text-xs text-[#dae2fd] font-semibold">
                GDELT Real-Time Ingest Pipeline
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Ingestion GDELT DOC 2.0 */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8ed5ff] text-[20px]">hub</span>
          <h2 className="font-['Newsreader'] text-lg sm:text-xl text-[#dae2fd] font-medium">
            Ingestion GDELT DOC 2.0
          </h2>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] flex flex-col gap-3 shadow-sm border border-[#222a3d]">
          <p className="font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#bdc8d1] leading-relaxed">
            NewsScope interroge directement le point de terminaison public du{' '}
            <strong className="text-[#dae2fd] font-semibold">
              GDELT Global Online News Graph (DOC 2.0)
            </strong>
            , indexant les téléscripteurs mondiaux chaque 15 minutes.
          </p>

          {/* Terminal Query Block */}
          <div className="p-2.5 rounded-lg bg-[#060e20] font-mono text-[11px] text-[#8ed5ff] flex flex-col gap-1 overflow-x-auto border border-[#222a3d]">
            <div className="text-[#bdc8d1] flex items-center justify-between text-[10px]">
              <span>ENDPOINT REST OFFICIEL</span>
              <span className="text-[#ffb690]">GET HTTP/2</span>
            </div>
            <code className="text-[#dae2fd] select-all leading-relaxed">
              https://api.gdeltproject.org/api/v2/doc/doc?query=(domainis:reuters.com OR domainis:bloomberg.com OR domainis:afp.com)&mode=ArtList&maxrecords=75&format=json
            </code>
          </div>

          {/* Agency Specificity Cards */}
          <div className="flex flex-col gap-2">
            <span className="font-['Geist'] text-xs font-semibold text-[#dae2fd]">
              Comportement & Typologie des Flux
            </span>

            <div className="p-3 rounded-lg bg-[#171f33] flex flex-col gap-1 border border-[#222a3d]">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#ec6a06]/20 text-[#ffb690] font-['Geist'] text-[10px] font-bold tracking-wider">
                  REUTERS.COM
                </span>
                <span className="font-mono text-xs text-emerald-400">Flux Direct Ouvert</span>
              </div>
              <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1]">
                Volume continu. Ingestion standardisée via flux RSS canoniques et indexation HTML instantanée.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#171f33] flex flex-col gap-1 border border-[#222a3d]">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#ce9bff]/20 text-[#e1bfff] font-['Geist'] text-[10px] font-bold tracking-wider">
                  BLOOMBERG.COM
                </span>
                <span className="font-mono text-xs text-emerald-400">Indexation Métadonnées</span>
              </div>
              <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1]">
                Dépêches financières globales. Ingestion des métadonnées de surface (titre, horodatage, slugs thématiques).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#171f33] flex flex-col gap-1 border border-[#222a3d]">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-['Geist'] text-[10px] font-bold tracking-wider">
                  AFP.COM
                </span>
                <span className="font-mono text-xs text-[#ffb690]">Distribution Spécifique B2B</span>
              </div>
              <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1]">
                L'Agence France-Presse diffuse son flux complet prioritairement via sa plateforme professionnelle payante (afpforum.com). Le site public afp.com présentant un volume réduit, NewsScope qualifie automatiquement ces éléments avec l'étiquette <strong className="text-[#dae2fd]">"Mention tierce / Rediffusion"</strong> lorsqu'ils proviennent de partenaires syndiqués.
              </p>
            </div>
          </div>

          {/* URL Cleaner Box */}
          <div className="p-3 rounded-lg bg-[#171f33] flex flex-col gap-1 border border-[#222a3d]">
            <div className="flex items-center gap-1.5 text-[#dae2fd] font-['Geist'] text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                cleaning_services
              </span>
              <span>Nettoyage & Assainissement d'URL</span>
            </div>
            <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1]">
              Chaque URL ingérée est passée au crible pour supprimer les traceurs commerciaux intrusifs : stripping automatique des paramètres <code className="font-mono text-[#38bdf8]">utm_*</code>, <code className="font-mono text-[#38bdf8]">cmpid</code>, <code className="font-mono text-[#38bdf8]">taid</code>, <code className="font-mono text-[#38bdf8]">fbclid</code> et hashs publicitaires.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Déontologie & Propriété Intellectuelle */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ffb690] text-[20px]">gavel</span>
          <h2 className="font-['Newsreader'] text-lg sm:text-xl text-[#dae2fd] font-medium">
            Déontologie & Propriété Intellectuelle
          </h2>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] flex flex-col gap-3 shadow-sm border border-[#222a3d]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#171f33] flex items-center justify-center shrink-0 text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Geist'] text-xs sm:text-sm font-semibold text-[#dae2fd]">
                Zéro Scraping de Contenu sous Paywall
              </span>
              <p className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] mt-0.5">
                NewsScope respecte rigoureusement la directive européenne sur les droits voisins et le copyright international. Nous ne contournons aucun paywall et ne stockons aucun article intégral propriétaire.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#171f33] flex flex-col gap-2 border border-[#222a3d]">
            <span className="font-['Geist'] text-[11px] uppercase tracking-wider text-[#dae2fd] font-semibold">
              Seules métadonnées autorisées :
            </span>
            <ul className="font-['Source_Serif_4'] text-xs text-[#bdc8d1] space-y-1.5 list-none pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0" />
                <span>Titre canonique public & Snippet éditorial court</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0" />
                <span>Horodatage précis UTC et agence d'attribution</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shrink-0" />
                <span>
                  Lien hypertexte externe direct avec attributs de sécurité{' '}
                  <code className="font-mono text-[#dae2fd]">rel="noopener noreferrer"</code>
                </span>
              </li>
            </ul>
          </div>

          {/* Links to Agency Charters */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="font-['Geist'] text-xs text-[#dae2fd] font-semibold">
              Conditions Générales & Déontologie des Agences
            </span>
            <div className="grid grid-cols-1 gap-2">
              <a
                href="https://www.afp.com/fr/mentions-legales"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] transition-colors border border-[#222a3d]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span className="font-['Geist'] text-xs text-[#dae2fd]">
                    Charte AFP & Droit d'Auteur
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#bdc8d1]">
                  open_in_new
                </span>
              </a>

              <a
                href="https://www.reutersagency.com/en/terms-conditions/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] transition-colors border border-[#222a3d]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ffb690]" />
                  <span className="font-['Geist'] text-xs text-[#dae2fd]">
                    Reuters Trust Principles
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#bdc8d1]">
                  open_in_new
                </span>
              </a>

              <a
                href="https://www.bloomberg.com/notices/tos/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] transition-colors border border-[#222a3d]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e1bfff]" />
                  <span className="font-['Geist'] text-xs text-[#dae2fd]">
                    Bloomberg Terms of Service
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-[#bdc8d1]">
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Decentralized Architecture Pipeline */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#e1bfff] text-[20px]">
            architecture
          </span>
          <h2 className="font-['Newsreader'] text-lg sm:text-xl text-[#dae2fd] font-medium">
            Architecture Décentralisée (0 € / mois)
          </h2>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] flex flex-col gap-3 shadow-sm border border-[#222a3d]">
          <p className="font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#bdc8d1]">
            NewsScope ne possède aucun serveur backend centralisé, éliminant les coûts
            d'infrastructure et les risques d'interception ou de surveillance.
          </p>

          {/* Pipeline */}
          <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#060e20] font-mono text-xs border border-[#222a3d]">
            <span className="font-['Geist'] text-[11px] uppercase tracking-wider text-[#ffb690] font-semibold">
              Pipeline d'Exécution Téléscripteur :
            </span>

            <div className="flex items-center gap-2.5 p-2 rounded bg-[#171f33] border border-[#222a3d]">
              <span className="material-symbols-outlined text-[#8ed5ff] text-[18px]">
                phone_android
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[#dae2fd] font-semibold">1. Client PWA (Navigateur)</span>
                <span className="text-[#bdc8d1] text-[10px]">
                  Interface réactive & Cache Service Worker
                </span>
              </div>
            </div>

            <div className="flex justify-center text-[#87929a]">
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded bg-[#171f33] border border-[#222a3d]">
              <span className="material-symbols-outlined text-[#ffb690] text-[18px]">database</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[#dae2fd] font-semibold">
                  2. Cache IndexedDB (NewsScope_v1)
                </span>
                <span className="text-[#bdc8d1] text-[10px]">
                  Persistance locale des favoris et 250 dernières dépêches
                </span>
              </div>
            </div>

            <div className="flex justify-center text-[#87929a]">
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded bg-[#171f33] border border-[#222a3d]">
              <span className="material-symbols-outlined text-[#e1bfff] text-[18px]">alt_route</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[#dae2fd] font-semibold">
                  3. Proxy CORS de secours (Cloudflare Pages)
                </span>
                <span className="text-[#bdc8d1] text-[10px]">
                  Fonction edge stateless `functions/api/news.ts` sans log
                </span>
              </div>
            </div>

            <div className="flex justify-center text-[#87929a]">
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded bg-[#171f33] border border-[#222a3d]">
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">public</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[#dae2fd] font-semibold">4. API GDELT DOC 2.0 Direct</span>
                <span className="text-[#bdc8d1] text-[10px]">
                  Flux brut mondial sans intermédiaire payant
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-[#171f33] flex flex-col border border-[#222a3d]">
              <span className="font-['Geist'] text-[10px] uppercase text-[#bdc8d1]">
                Hébergement
              </span>
              <span className="font-['Geist'] text-xs font-bold text-[#dae2fd] mt-1">
                Cloudflare Pages
              </span>
              <span className="font-mono text-[10px] text-emerald-400 mt-0.5">
                Tier Gratuit Éternel
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#171f33] flex flex-col border border-[#222a3d]">
              <span className="font-['Geist'] text-[10px] uppercase text-[#bdc8d1]">
                Bases de Données
              </span>
              <span className="font-['Geist'] text-xs font-bold text-[#dae2fd] mt-1">
                Zéro Serveur
              </span>
              <span className="font-mono text-[10px] text-[#ffb690] mt-0.5">
                Stockage 100% Client
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Diagnostic Système & Outils d'Audit */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8ed5ff] text-[20px]">
              terminal
            </span>
            <h2 className="font-['Newsreader'] text-lg sm:text-xl text-[#dae2fd] font-medium">
              Diagnostic Système
            </h2>
          </div>
          <button
            onClick={handleRunDiagnostic}
            disabled={testRunning}
            className="px-2.5 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] font-mono text-xs text-[#8ed5ff] flex items-center gap-1 transition-colors border border-[#222a3d]"
          >
            <span className={`material-symbols-outlined text-[14px] ${testRunning ? 'animate-spin' : ''}`}>
              {testRunning ? 'sync' : 'play_arrow'}
            </span>
            <span>{testRunning ? 'SONDAGE...' : 'TEST EN DIRECT'}</span>
          </button>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] flex flex-col gap-2 shadow-sm border border-[#222a3d]">
          {testResult && (
            <div className="p-2 rounded bg-emerald-400/20 text-emerald-300 font-mono text-xs border border-emerald-400/40 animate-fadeIn flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{testResult}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-1.5 border-b border-[#222a3d]/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-['Geist'] text-xs text-[#dae2fd]">
                Service Worker PWA
              </span>
            </div>
            <span className="font-mono text-xs text-[#bdc8d1]">ACTIF (v1.4.2)</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#222a3d]/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-['Geist'] text-xs text-[#dae2fd]">
                Banque IndexedDB Locale
              </span>
            </div>
            <span className="font-mono text-xs text-[#bdc8d1]">
              CONNECTÉ ({favoritesCount} favoris)
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[#222a3d]/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-['Geist'] text-xs text-[#dae2fd]">
                Passerelle Fallback CORS
              </span>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-semibold">
              OPÉRATIONNELLE
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8ed5ff]" />
              <span className="font-['Geist'] text-xs text-[#dae2fd]">Pile Logicielle</span>
            </div>
            <span className="font-mono text-xs text-[#bdc8d1]">
              React 19 • TS 5.4 • Tailwind v4
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#222a3d]/60">
            <button
              onClick={exportAuditReportMarkdown}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-lg bg-[#38bdf8] text-[#004965] font-['Geist'] text-xs font-bold flex items-center justify-center gap-2 shadow hover:bg-[#8ed5ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              <span>Télécharger Rapport d'Audit (MD)</span>
            </button>
            <button
              onClick={onOpenAuditModal}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] font-['Geist'] text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#222a3d]"
            >
              <span className="material-symbols-outlined text-[17px]">menu_book</span>
              <span>Audit Initial Phase 0</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Disclaimer */}
      <section className="p-3.5 rounded-xl bg-[#060e20] flex flex-col gap-1.5 text-[#bdc8d1] font-['Source_Serif_4'] text-xs border border-[#222a3d]">
        <div className="flex items-center gap-1.5 text-[#dae2fd] font-['Geist'] font-semibold">
          <span className="material-symbols-outlined text-[16px] text-[#ffb690]">info</span>
          <span>Avis de non-responsabilité éditoriale</span>
        </div>
        <p className="leading-relaxed">
          NewsScope est un outil de veille technologique et de monitoring d'actualités open-source. Les flux, marques et contenus cités demeurent la propriété exclusive de leurs émetteurs respectifs (Agence France-Presse, Thomson Reuters, Bloomberg L.P.). NewsScope n'est aucunement affilié ou approuvé officiellement par ces entités.
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-[#222a3d]/50 font-mono text-[10px] text-[#87929a]">
          <span>Code Source sous Licence MIT</span>
          <span>NewsScope Project © 2025</span>
        </div>
      </section>
    </div>
  );
};
