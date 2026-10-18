import React, { useState } from 'react';
import { Dispatch } from '../types';

interface JsonInspectorModalProps {
  dispatch?: Dispatch | null;
  onClose: () => void;
}

export const JsonInspectorModal: React.FC<JsonInspectorModalProps> = ({
  dispatch,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'tree' | 'raw' | 'signatures'>('tree');
  const [searchQuery, setSearchQuery] = useState('sentiment');
  const [isExpandedAll, setIsExpandedAll] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    gkg_telemetry: true,
    sentiment_vector: true,
    thematic_tags: true,
    ingestion: false,
    article: false,
    pwa_cache_metadata: false,
  });
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const handleExpandAll = (expand: boolean) => {
    setIsExpandedAll(expand);
    setExpandedNodes({
      root: expand,
      gkg_telemetry: expand,
      sentiment_vector: expand,
      thematic_tags: expand,
      ingestion: expand,
      article: expand,
      pwa_cache_metadata: expand,
    });
  };

  const jsonPayload = {
    ingestion: {
      doc_id: dispatch?.gkgId || '99824102',
      timestamp_utc: dispatch?.timestamp || '2025-03-30T14:02:44Z',
      node_cluster: 'FRA-04-GDELT',
      protocol_version: 'DOC2_v2.1',
    },
    article: {
      source_domain: dispatch?.agency === 'reuters' ? 'reuters.com' : 'bloomberg.com',
      canonical_url: dispatch?.canonicalUrl || 'https://www.reuters.com/markets/ecb-rate-cuts-lagarde',
      cleaned_url: dispatch?.cleanedUrl || 'https://www.reuters.com/markets/ecb-rate-cuts-lagarde-inflation-slowdown-2025',
      title: dispatch?.title || "BCE : Christine Lagarde confirme l'accélération...",
      bureau_desk: dispatch?.bureauDesk || 'FRANKFURT DESK',
      word_count: dispatch?.wordCount || 800,
    },
    gkg_telemetry: {
      confidence_score: dispatch?.confidenceScore || 100,
      sentiment_vector: {
        tone_score: dispatch?.sentimentScore ?? -0.42,
        polarity: 2.18,
        activity_density: 18.4,
      },
      thematic_tags: [
        'ECON_CENTRALBANK',
        'MARKET_SENTIMENT_BEARISH',
        'GEO_EUROZONE_ECB',
      ],
      raw_sentiment_hash: 'sha256:7f89b4e10c78a011de9821...',
      media_velocity: dispatch?.mediaVelocity || 142,
    },
    pwa_cache_metadata: {
      storage_key: dispatch?.id || 'doc_reuters_88c2f1',
      stored_locally: true,
      sha256_verified: true,
      lru_expiry_days: 7,
    },
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#0b1326] rounded-xl overflow-hidden shadow-2xl border border-[#38bdf8]/30 font-['Geist'] text-xs text-[#dae2fd]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header: Meta, Identifier, Actions & Tabs */}
        <div className="bg-[#171f33] p-3.5 flex flex-col space-y-3 border-b border-[#222a3d]">
          {/* Top Meta Line */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#222a3d] flex items-center justify-center shrink-0 text-[#38bdf8]">
                <span className="material-symbols-outlined text-[19px]">data_object</span>
              </div>
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-['Newsreader'] text-sm sm:text-base text-[#dae2fd] font-semibold truncate">
                    Inspecteur Payload JSON Brut
                  </h2>
                  <span className="px-1.5 py-0.2 rounded bg-[#222a3d] text-[#bdc8d1] font-mono text-[10px]">
                    4.1 KO
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#bdc8d1]/80 truncate">
                  GDELT DOC 2.0 • Paquet #{dispatch?.gkgId || '99824102'}
                </p>
              </div>
            </div>

            {/* Window Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleCopy(JSON.stringify(jsonPayload, null, 2), 'JSON copié !')}
                aria-label="Copier le payload"
                className="w-8 h-8 rounded-lg bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] flex items-center justify-center transition-colors"
                title="Copier le JSON complet"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Fermer l'inspecteur"
                className="w-8 h-8 rounded-lg bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] hover:bg-[#31394d] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#060e20] p-1 rounded-lg border border-[#222a3d]">
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex-1 py-1.5 px-2.5 rounded flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors ${
                activeTab === 'tree'
                  ? 'bg-[#222a3d] text-[#38bdf8] shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              <span>Arborescence</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex-1 py-1.5 px-2.5 rounded flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors ${
                activeTab === 'raw'
                  ? 'bg-[#222a3d] text-[#38bdf8] shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">code</span>
              <span>Texte Brut</span>
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`flex-1 py-1.5 px-2.5 rounded flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors ${
                activeTab === 'signatures'
                  ? 'bg-[#222a3d] text-[#38bdf8] shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span>Signatures</span>
            </button>
          </div>
        </div>

        {/* 2. Telemetry Search Bar */}
        <div className="bg-[#060e20] p-3 flex flex-col space-y-1.5 border-b border-[#222a3d]">
          <div className="flex items-center gap-2 bg-[#171f33] px-3 py-1.5 rounded-lg border border-[#ec6a06]/40">
            <span className="material-symbols-outlined text-[#ffb690] text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer clés, chaînes, tokens ou identifiants..."
              className="flex-1 min-w-0 bg-transparent text-[#dae2fd] font-mono text-xs focus:outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded bg-[#ec6a06]/20 text-[#ffb690] font-mono text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ec6a06] animate-pulse" />
                4 / 4
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 rounded flex items-center justify-center text-[#87929a] hover:text-[#dae2fd]"
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-1 rounded bg-[#ec6a06]/15 text-[#dae2fd] text-[11px] flex-wrap gap-1 border border-[#ec6a06]/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[#ffb690] text-[15px] shrink-0">
                filter_alt
              </span>
              <span className="truncate">
                Filtre : <span className="text-[#ffb690] font-mono font-bold">« sentiment »</span> • 4 correspondances • 3 nœuds
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-[#ec6a06] text-[#341100] font-mono text-[9px] uppercase font-bold shrink-0">
              Suggestion appliquée
            </span>
          </div>
        </div>

        {/* 3. Central Content View */}
        <div className="flex-1 overflow-y-auto p-3.5 font-mono text-xs max-h-[46vh] space-y-2">
          {activeTab === 'tree' && (
            <div className="space-y-2 text-left">
              {/* Unfold Controls */}
              <div className="flex items-center justify-between pb-2 border-b border-[#222a3d] text-[11px] text-[#bdc8d1]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExpandAll(!isExpandedAll)}
                    className="flex items-center gap-1 text-[#38bdf8] hover:text-[#8ed5ff]"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isExpandedAll ? 'unfold_less' : 'unfold_more'}
                    </span>
                    <span>{isExpandedAll ? 'Tout replier' : 'Tout déplier (Actif)'}</span>
                  </button>
                  <span className="text-[#87929a]">|</span>
                  <span className="flex items-center gap-1 text-[#ffb690]">
                    <span className="material-symbols-outlined text-[14px]">filter_list</span>
                    <span>Filtre actif</span>
                  </span>
                </div>
                <span className="text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded font-mono text-[10px]">
                  1 branche active
                </span>
              </div>

              {/* Node Root */}
              <div className="flex items-center gap-1.5 text-[#38bdf8] font-semibold cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                <span>root : Object(4)</span>
              </div>

              <div className="pl-4 space-y-1.5 border-l border-[#222a3d]">
                {/* 1. Ingestion node */}
                <div
                  onClick={() => toggleNode('ingestion')}
                  className="flex items-center justify-between py-1 px-2 rounded bg-[#171f33]/40 opacity-40 hover:opacity-80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-[#87929a]">
                      {expandedNodes.ingestion ? 'expand_more' : 'chevron_right'}
                    </span>
                    <span className="text-[#bdc8d1]">ingestion</span>
                    <span className="text-[#87929a]">: Object(4)</span>
                  </div>
                  <span className="text-[10px] text-[#87929a] italic">[masqué par filtre]</span>
                </div>

                {/* 2. Article node */}
                <div
                  onClick={() => toggleNode('article')}
                  className="flex items-center justify-between py-1 px-2 rounded bg-[#171f33]/40 opacity-40 hover:opacity-80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-[#87929a]">
                      {expandedNodes.article ? 'expand_more' : 'chevron_right'}
                    </span>
                    <span className="text-[#bdc8d1]">article</span>
                    <span className="text-[#87929a]">: Object(6)</span>
                  </div>
                  <span className="text-[10px] text-[#87929a] italic">[atténué]</span>
                </div>

                {/* 3. gkg_telemetry (MATCHING BRANCH) */}
                <div className="rounded-lg border border-[#ec6a06]/40 bg-[#171f33]/90 p-2 space-y-2">
                  <div
                    onClick={() => toggleNode('gkg_telemetry')}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb690] text-[16px]">
                        {expandedNodes.gkg_telemetry ? 'expand_more' : 'chevron_right'}
                      </span>
                      <span className="text-[#ffb690] font-semibold">gkg_telemetry</span>
                      <span className="text-[#bdc8d1] text-[11px]">: Object(6 clés)</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-[#ec6a06]/20 text-[#ffb690] text-[10px] font-semibold">
                      1 Nœud actif
                    </span>
                  </div>

                  {expandedNodes.gkg_telemetry && (
                    <div className="pl-3 space-y-2 border-l border-[#ec6a06]/40">
                      {/* Sub-node: sentiment_vector */}
                      <div className="rounded bg-[#0b1326] p-2 space-y-1.5 border border-[#ec6a06]/60">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[#ffb690] text-[14px]">
                              expand_more
                            </span>
                            <span className="text-[#ffb690] font-bold bg-[#ec6a06]/20 px-1 py-0.5 rounded">
                              sentiment_vector
                            </span>
                            <span className="text-[#87929a] text-[11px]">: Object(3 clés)</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded bg-[#ec6a06] text-[#341100] text-[9px] uppercase font-bold tracking-wider">
                            CORRESPONDANCE DIRECTE
                          </span>
                        </div>

                        <div className="pl-4 space-y-0.5 text-[11px]">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-[#bdc8d1]">"tone_score" :</span>
                            <span className="text-[#ffb690] font-bold">
                              {dispatch?.sentimentScore ?? -0.42} (Number)
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-[#bdc8d1]">"polarity" :</span>
                            <span className="text-[#dae2fd]">2.18 (Number)</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-[#bdc8d1]">"activity_density" :</span>
                            <span className="text-[#dae2fd]">18.40 (Number)</span>
                          </div>
                        </div>
                      </div>

                      {/* Sub-node: thematic_tags with MATCH */}
                      <div className="rounded bg-[#131b2e] p-2 space-y-1 border border-[#222a3d]">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#bdc8d1] text-[14px]">
                            expand_more
                          </span>
                          <span className="text-[#bdc8d1]">thematic_tags : Array(3)</span>
                        </div>
                        <div className="pl-4 space-y-1 text-[11px]">
                          <div className="text-[#87929a]">0: "ECON_CENTRALBANK"</div>
                          <div className="flex items-center justify-between py-0.5 bg-[#ec6a06]/15 px-1.5 rounded">
                            <span className="text-[#ffb690] font-semibold">
                              "MARKET_<mark className="bg-amber-400/30 text-amber-200 px-0.5 rounded">SENTIMENT</mark>_BEARISH"
                            </span>
                            <span className="px-1 rounded bg-[#ec6a06] text-[#341100] text-[9px] font-bold">
                              MATCH
                            </span>
                          </div>
                          <div className="text-[#87929a]">2: "GEO_EUROZONE_ECB"</div>
                        </div>
                      </div>

                      {/* raw_sentiment_hash */}
                      <div className="flex items-center justify-between py-1 px-2 rounded bg-[#0b1326] text-[11px] border border-[#222a3d]">
                        <div className="truncate">
                          <span className="text-[#ffb690] underline decoration-[#ffb690]">
                            raw_sentiment_hash
                          </span>
                          : <span className="text-[#bdc8d1]">"sha256:7f89b4e10c..."</span>
                        </div>
                        <button
                          onClick={() => handleCopy('sha256:7f89b4e10c78a011de9821...', 'Hash copié !')}
                          className="text-[#87929a] hover:text-[#dae2fd] p-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. pwa_cache_metadata */}
                <div
                  onClick={() => toggleNode('pwa_cache_metadata')}
                  className="flex items-center justify-between py-1 px-2 rounded bg-[#171f33]/40 opacity-40 hover:opacity-80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-[#87929a]">
                      {expandedNodes.pwa_cache_metadata ? 'expand_more' : 'chevron_right'}
                    </span>
                    <span className="text-[#bdc8d1]">pwa_cache_metadata</span>
                    <span className="text-[#87929a]">: Object(4)</span>
                  </div>
                  <span className="text-[10px] text-[#87929a] italic">[atténué]</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <pre className="p-3 bg-[#060e20] rounded-lg border border-[#222a3d] leading-relaxed text-[#c4e7ff] overflow-x-auto text-[11px] select-all">
              {JSON.stringify(jsonPayload, null, 2)}
            </pre>
          )}

          {activeTab === 'signatures' && (
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-[#171f33] border border-[#222a3d] space-y-1.5">
                <span className="text-[#38bdf8] font-bold block">
                  Empreinte Cryptographique SHA-256
                </span>
                <p className="text-[#dae2fd] break-all bg-[#060e20] p-2 rounded border border-[#222a3d]">
                  {dispatch?.sha256 || '88c2f10b7a4e912fcc004e8d387fba4190e219aa2014ff91a'}
                </p>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10px]">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  Hash immuable certifié à l'ingestion GDELT
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#171f33] border border-[#222a3d] space-y-1">
                <span className="text-[#ffb690] font-bold block">
                  Certificat d'Attribution d'Agence
                </span>
                <div className="flex items-center justify-between text-[#bdc8d1]">
                  <span>Émetteur :</span>
                  <span className="text-[#dae2fd]">
                    {dispatch?.agencyLabel || 'Reuters Official Wire'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#bdc8d1]">
                  <span>Origine Canonique :</span>
                  <span className="text-[#38bdf8] truncate max-w-xs">
                    {dispatch?.canonicalUrl}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#bdc8d1]">
                  <span>Horodatage UTC :</span>
                  <span className="text-[#dae2fd]">{dispatch?.timestamp}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Bottom Footer & Actions */}
        <div className="bg-[#171f33] p-3 flex flex-col space-y-2 border-t border-[#222a3d]">
          <div className="flex items-center justify-between text-[11px] text-[#bdc8d1] bg-[#060e20] px-3 py-1.5 rounded border border-[#222a3d]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#ec6a06] animate-pulse shrink-0" />
              <span className="truncate">
                {copiedStatus || "Filtre actif : « sentiment » • 4 correspondances"}
              </span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold shrink-0 pl-1">
              JSON Valide ✓
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(JSON.stringify(jsonPayload.gkg_telemetry, null, 2), 'Résultats filtrés copiés !')}
              className="flex-1 py-2 px-3 rounded bg-[#222a3d] hover:bg-[#31394d] text-[#dae2fd] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#222a3d]"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>Copier les résultats</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#004965] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">done</span>
              <span>Fermer l'inspecteur</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[#87929a] text-[10px] pt-0.5">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-[#222a3d] text-[#dae2fd]">ESC</kbd> Fermer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-[#222a3d] text-[#dae2fd]">⌘F</kbd> Rechercher
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
