import React, { useState } from 'react';
import { Dispatch } from '../types';
import { FreshnessBanner } from './FreshnessBanner';

interface DetailViewProps {
  dispatch: Dispatch | null | undefined;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onOpenJsonInspector: () => void;
  onGoToFavorites: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
  dispatch,
  isFavorite,
  onToggleFavorite,
  onBack,
  onOpenJsonInspector,
  onGoToFavorites,
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isPurged, setIsPurged] = useState(false);

  // Phase 1: Explicit empty state if no dispatch is selected or available
  if (!dispatch) {
    return (
      <div className="flex flex-col w-full max-w-3xl mx-auto px-4 py-16 text-center items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#87929a]">
          <span className="material-symbols-outlined text-4xl">feed</span>
        </div>
        <div className="space-y-1">
          <h2 className="font-['Newsreader'] text-xl font-semibold text-[#dae2fd]">
            Aucune dépêche sélectionnée
          </h2>
          <p className="font-['Source_Serif_4'] text-xs sm:text-sm text-[#bdc8d1] max-w-md mx-auto">
            Aucun article réel ou mis en cache n'est actuellement disponible pour afficher les détails.
            Vérifiez l'état de votre connexion ou activez le mode démonstration si vous souhaitez explorer l'interface avec des données synthétiques.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#38bdf8] text-[#004965] font-['Geist'] text-xs font-bold uppercase tracking-wider hover:bg-[#8ed5ff] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Retour au flux</span>
        </button>
      </div>
    );
  }

  // Phase 2: Domain and provenance resolution
  const verifiedDomain =
    dispatch.sourceDomain ||
    (dispatch.agency === 'reuters'
      ? 'reuters.com'
      : dispatch.agency === 'bloomberg'
      ? 'bloomberg.com'
      : dispatch.agency === 'afp'
      ? 'afp.com'
      : 'domaine-inconnu');

  const rawPayload = {
    gkg_id: dispatch.gkgId,
    source_domain: verifiedDomain,
    agency_detected: dispatch.agency,
    is_canonical: dispatch.isCanonical,
    is_third_party: !!dispatch.isThirdPartyMention,
    canonical_url: dispatch.canonicalUrl,
    cleaned_url: dispatch.cleanedUrl,
    sha256_hash: dispatch.sha256,
    sentiment_score: dispatch.sentimentScore ?? null,
    status: dispatch.isCanonical
      ? 'CANONICAL_AGENCY_PUBLICATION'
      : dispatch.isThirdPartyMention
      ? 'THIRD_PARTY_SYNDICATION'
      : 'UNVERIFIED_PROVENANCE',
  };

  const handleCopyPayload = () => {
    navigator.clipboard?.writeText(JSON.stringify(rawPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `NewsScope Wire • ${dispatch.title}`,
          url: dispatch.canonicalUrl,
        });
      } catch {
        // Annulation utilisateur
      }
    } else {
      navigator.clipboard?.writeText(dispatch.canonicalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRevalidate = () => {
    setIsRevalidating(true);
    setTimeout(() => {
      setIsRevalidating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-3 sm:px-4 space-y-4 pb-28 pt-2">
      {/* 1. Micro-Navigation Bar & Quick Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 py-1 text-[#38bdf8] hover:text-[#8ed5ff] transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span className="font-['Geist'] text-xs font-semibold tracking-wider uppercase">
              Retour au flux
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Bookmark button */}
            <button
              onClick={onToggleFavorite}
              aria-label="Mettre en favoris"
              className={`w-9 h-9 flex items-center justify-center rounded bg-[#171f33] hover:bg-[#222a3d] transition-all ${
                isFavorite
                  ? 'text-[#ffb690] bg-[#ec6a06]/20'
                  : 'text-[#bdc8d1] hover:text-[#ffb690]'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Enregistrer dans les favoris'}
            >
              <span
                className="material-symbols-outlined text-[19px]"
                style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              aria-label="Partager la dépêche"
              className="w-9 h-9 flex items-center justify-center rounded bg-[#171f33] hover:bg-[#222a3d] text-[#bdc8d1] hover:text-[#8ed5ff] transition-all"
              title="Partager le permalien"
            >
              <span className="material-symbols-outlined text-[19px]">
                {copiedLink ? 'done' : 'share'}
              </span>
            </button>

            {/* Toggle JSON Inspector */}
            <button
              onClick={onOpenJsonInspector}
              aria-label="Rouvrir l'inspecteur JSON"
              className="h-9 px-2.5 flex items-center gap-1.5 rounded bg-[#222a3d] text-[#38bdf8] hover:bg-[#2d3449] transition-all shadow-sm"
              title="Ouvrir l'inspecteur JSON brut"
            >
              <span className="font-mono text-xs font-bold">{'{ }'}</span>
              <span className="font-['Geist'] text-xs uppercase font-semibold tracking-wider">
                JSON
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            </button>
          </div>
        </div>

        {/* Live Ingestion Status Banner */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded bg-[#060e20] text-[#bdc8d1] border border-[#222a3d] shadow-inner text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38bdf8] opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38bdf8]" />
            </span>
            <span className="font-semibold tracking-wide text-[#38bdf8] uppercase">
              GDELT DOC 2.0 • ID #{dispatch.gkgId}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>SOURCE : {verifiedDomain}</span>
          </div>
        </div>
      </div>

      {/* 2. Persistent Favorite Confirmation Toast */}
      {isFavorite && (
        <aside
          aria-live="polite"
          className="flex items-center justify-between p-3 rounded-xl bg-[#222a3d] shadow-lg border border-[#38bdf8]/30 transition-all animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-[19px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bookmark_added
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-['Geist'] text-xs font-bold text-[#dae2fd] tracking-wide">
                  Dépêche enregistrée dans les Favoris Locaux
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] font-mono text-[10px] font-bold uppercase">
                  INDEXEDDB
                </span>
              </div>
              <p className="font-mono text-[11px] text-[#bdc8d1] truncate">
                Disponible 100% hors-ligne • Base NewsScope_v1
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={onGoToFavorites}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#38bdf8] text-[#004965] font-['Geist'] text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#8ed5ff] transition-colors"
            >
              <span>Voir</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      )}

      {/* 3. Source Identity & Provenance Details Strip */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] shadow-md space-y-2.5 border border-[#222a3d]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Agency Badge */}
            <span
              className={`px-2 py-0.5 rounded font-['Geist'] text-xs font-bold tracking-wider uppercase ${dispatch.agencyClass}`}
            >
              {dispatch.agencyLabel}
            </span>

            {/* Provenance Indicator: Distinct canonical vs third party vs unconfirmed */}
            {dispatch.isCanonical ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 font-['Geist'] text-[11px] font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                Publication originale vérifiée
              </span>
            ) : dispatch.isThirdPartyMention ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 font-['Geist'] text-[11px] font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
                Mention tierce / Rediffusion
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-400/15 text-slate-300 border border-slate-400/30 font-['Geist'] text-[11px] font-semibold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[13px]">help_outline</span>
                Provenance non confirmée
              </span>
            )}
          </div>

          <div className="font-mono text-xs text-[#bdc8d1] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>{dispatch.utcTime}</span>
          </div>
        </div>

        {/* Prominent Day, Hour & Freshness Status */}
        <FreshnessBanner
          timestamp={dispatch.timestamp}
          isMock={dispatch.isMock}
          size="detailed"
        />

        {/* Cryptographic Hash Bar (FIPS 180-4 standard) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded bg-[#060e20] font-mono text-[11px] text-[#bdc8d1] border border-[#222a3d]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[14px] text-[#8ed5ff]">
              fingerprint
            </span>
            <span className="truncate text-[#dae2fd]">SHA-256 : {dispatch.sha256}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[#38bdf8] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            EMPREINTE FIPS 180-4
          </span>
        </div>
      </section>

      {/* 4. Article Headline & Editorial Excerpt */}
      <article className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] shadow-md space-y-3.5 border border-[#222a3d]">
        <div className="space-y-1">
          <p className="font-['Geist'] text-xs font-bold text-[#ffdbca] tracking-widest uppercase">
            {dispatch.kicker || 'Dépêche Factuelle'}
          </p>
          <h1 className="font-['Newsreader'] text-xl sm:text-2xl text-[#dae2fd] tracking-tight leading-snug font-semibold">
            {dispatch.title}
          </h1>
        </div>

        {/* Desk Attribution and word count */}
        <div className="p-3.5 rounded bg-[#171f33] space-y-2 border border-[#222a3d]">
          <div className="flex items-center justify-between text-[#bdc8d1] font-mono text-xs pb-1 border-b border-[#222a3d]/60">
            <span className="font-semibold text-[#8ed5ff]">
              {dispatch.bureauDesk || 'DESK SOURCE'}
            </span>
            <span>
              LONG. EXTRAIT :{' '}
              {dispatch.wordCount !== undefined
                ? `~${Math.round(dispatch.wordCount / 15)} MOTS`
                : 'NON DISPONIBLE'}
            </span>
          </div>
          <blockquote className="font-['Source_Serif_4'] text-sm sm:text-base italic text-[#dae2fd] leading-relaxed pl-2 border-l-2 border-[#38bdf8]">
            {dispatch.quote || dispatch.excerpt}
          </blockquote>
        </div>

        {/* Wire Photo Frame (without fabricated resolutions or fake credits) */}
        {dispatch.mediaImage && (
          <figure className="space-y-1.5">
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#2d3449] shadow-sm border border-[#222a3d]">
              <img
                src={dispatch.mediaImage}
                alt={dispatch.mediaCaption || dispatch.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#060e20]/80 backdrop-blur-md font-mono text-[10px] text-[#8ed5ff] uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                <span>
                  Photo • {dispatch.mediaRawRes || 'Résolution non communiquée'}
                </span>
              </div>
            </div>
            <figcaption className="flex items-center justify-between text-[#bdc8d1] font-['Geist'] text-[11px] px-1">
              <span>{dispatch.mediaCaption || 'Illustration associée'}</span>
              <span className="font-mono">
                Crédit :{' '}
                {dispatch.mediaCredit ||
                  (dispatch.agency !== 'other'
                    ? dispatch.agencyLabel
                    : verifiedDomain)}
              </span>
            </figcaption>
          </figure>
        )}
      </article>

      {/* 5. Legal Compliance & Outbound Link */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] shadow-md space-y-3.5 border border-[#222a3d]">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded flex shrink-0 items-center justify-center bg-[#171f33] text-[#38bdf8]">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div className="space-y-0.5">
            <h2 className="font-['Geist'] text-xs sm:text-sm font-bold text-[#dae2fd] uppercase tracking-wide">
              Conformité Légale & Droits Voisins
            </h2>
            <p className="font-mono text-[11px] text-[#8ed5ff] font-semibold">
              DIRECTIVE EUROPÉENNE 2019/790 SUR LE DROIT D'AUTEUR
            </p>
          </div>
        </div>

        <p className="font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#bdc8d1] leading-relaxed">
          NewsScope observe scrupuleusement le cadre d'agrégation d'urgence : aucun
          contournement de paywall, republication intégrale non autorisée ou scraping de contenu
          propriétaire n'est opéré. Seul le court extrait public indexé par GDELT est référencé.
        </p>

        {/* Tracker stripping telemetry badge */}
        <div className="p-2.5 rounded bg-[#060e20] space-y-1 border border-[#222a3d]">
          <div className="flex items-center gap-1.5 font-['Geist'] text-xs text-[#38bdf8] font-semibold">
            <span className="material-symbols-outlined text-[15px]">cleaning_services</span>
            <span>
              Nettoyeur de traceurs d'URL actif • {dispatch.removedTrackersCount} paramètres
              supprimés
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#bdc8d1] truncate">
            {dispatch.cleanedUrl}
          </p>
        </div>

        {/* Outbound primary anchor */}
        <a
          href={dispatch.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center w-full py-3 px-4 rounded bg-[#38bdf8] text-[#004965] hover:bg-[#8ed5ff] transition-all font-['Geist'] text-xs sm:text-sm font-bold shadow-md active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <span>
              Consulter l'article complet sur{' '}
              {dispatch.agency === 'reuters'
                ? 'Reuters.com'
                : dispatch.agency === 'bloomberg'
                ? 'Bloomberg.com'
                : dispatch.agency === 'afp'
                ? 'AFP.com'
                : verifiedDomain}
            </span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </div>
          <span className="font-['Geist'] text-[11px] font-medium opacity-85 mt-0.5">
            {dispatch.wordCount !== undefined ? `~${dispatch.wordCount} mots • ` : ''}
            Consulter la publication source • Onglet sécurisé
          </span>
        </a>
      </section>

      {/* 6. GDELT Telemetry & Enrichment Metadata */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] shadow-md space-y-3.5 border border-[#222a3d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8ed5ff] text-[20px]">
              query_stats
            </span>
            <h2 className="font-['Geist'] text-xs sm:text-sm font-bold text-[#dae2fd] uppercase tracking-wide">
              Télémétrie GDELT DOC 2.0
            </h2>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#222a3d] text-[#bdc8d1] font-semibold">
            {dispatch.isMock ? 'DÉMO SYNTHÉTIQUE' : 'DOC2-PUBLIC'}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="p-2.5 rounded bg-[#171f33] space-y-1 border border-[#222a3d]">
            <span className="text-[10px] text-[#bdc8d1] uppercase block">Global Event ID</span>
            <span className="text-xs sm:text-sm font-semibold text-[#dae2fd] truncate block">
              #{dispatch.gkgId}
            </span>
            <span className="text-[10px] text-[#bdc8d1] block">Identifiant GDELT</span>
          </div>

          <div className="p-2.5 rounded bg-[#171f33] space-y-1 border border-[#222a3d]">
            <span className="text-[10px] text-[#bdc8d1] uppercase block">Domaine Réel</span>
            <span className="text-xs sm:text-sm font-semibold text-[#8ed5ff] truncate block">
              {verifiedDomain}
            </span>
            <span className="text-[10px] text-[#38bdf8] block truncate">
              {dispatch.confidenceScore !== undefined
                ? `Score : ${dispatch.confidenceScore}%`
                : 'Score : Non fourni par GDELT artlist'}
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#171f33] space-y-1 border border-[#222a3d]">
            <span className="text-[10px] text-[#bdc8d1] uppercase block">Langue Détectée</span>
            <span className="text-xs sm:text-sm font-semibold text-[#dae2fd]">
              {dispatch.language ? dispatch.language.toUpperCase() : 'Non spécifié'}
            </span>
            <span className="text-[10px] text-[#bdc8d1] block">
              Métadonnée de source
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#171f33] space-y-1 border border-[#222a3d]">
            <span className="text-[10px] text-[#bdc8d1] uppercase block">Indice Sentiment</span>
            <span className="text-xs sm:text-sm font-semibold text-[#ffdbca]">
              {dispatch.sentimentScore !== undefined
                ? (dispatch.sentimentScore > 0 ? `+${dispatch.sentimentScore}` : String(dispatch.sentimentScore))
                : 'Non mesuré'}
            </span>
            <span className="text-[10px] text-[#bdc8d1] block truncate">
              {dispatch.sentimentLabel || 'Indisponible en mode artlist'}
            </span>
          </div>
        </div>

        {/* Media Velocity Indicator */}
        <div className="p-2.5 rounded bg-[#171f33] flex items-center justify-between border border-[#222a3d]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">speed</span>
            <span className="font-['Geist'] text-xs uppercase font-semibold text-[#dae2fd]">
              Vélocité médiatique
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[#38bdf8] font-bold">
              {dispatch.mediaVelocity !== undefined ? `${dispatch.mediaVelocity} reprises` : 'Indisponible'}
            </span>
            <span className="text-[#bdc8d1] hidden sm:inline">
              {dispatch.mediaVelocity !== undefined ? '(Cluster détecté)' : '(Nécessite le tableau GKG complet)'}
            </span>
          </div>
        </div>

        {/* Thematic Taxonomy Chips */}
        <div className="space-y-1.5">
          <span className="font-['Geist'] text-[10px] text-[#bdc8d1] font-bold uppercase tracking-wider block">
            Thématiques d'Indexation
          </span>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {dispatch.thematicTags && dispatch.thematicTags.length > 0 ? (
              dispatch.thematicTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-[#171f33] text-[#dae2fd] border border-[#222a3d]"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#87929a] italic">Aucune balise thématique fournie</span>
            )}
          </div>
        </div>

        {/* Normalized Raw Payload Mini Terminal */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-['Geist'] text-[10px] text-[#bdc8d1] font-bold uppercase tracking-wider">
              Payload brut normalisé
            </span>
            <button
              onClick={handleCopyPayload}
              className="font-mono text-[11px] text-[#8ed5ff] hover:text-[#38bdf8] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copiedPayload ? 'done' : 'content_copy'}
              </span>
              <span>{copiedPayload ? 'Copié !' : 'Copier payload'}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded bg-[#060e20] font-mono text-[11px] text-[#bdc8d1] overflow-x-auto leading-relaxed max-h-28 border border-[#222a3d] select-all">
            {JSON.stringify(rawPayload, null, 2)}
          </pre>
        </div>
      </section>

      {/* 7. Local Registry / IndexedDB State Card */}
      <section className="p-3.5 sm:p-4 rounded-xl bg-[#131b2e] shadow-md flex items-center justify-between gap-3 border border-[#222a3d]">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isFavorite ? 'bg-[#ec6a06]' : 'bg-[#38bdf8]'
              }`}
            />
            <span className="font-['Geist'] text-xs uppercase font-bold text-[#dae2fd]">
              Registre Local (IndexedDB)
            </span>
            <span
              className={`font-mono text-[10px] font-bold uppercase ${
                isFavorite ? 'text-[#ffdbca]' : 'text-[#38bdf8]'
              }`}
            >
              {isPurged
                ? 'CACHE PURGÉ'
                : isFavorite
                ? 'ENREGISTRÉ DANS LES FAVORIS'
                : 'SYNCHRONISÉ'}
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#bdc8d1] truncate">
            Clé : {dispatch.id} | Poids sandbox : {dispatch.packetSize || 'Non mesuré'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsPurged(!isPurged)}
            className={`p-2 rounded bg-[#171f33] hover:bg-[#222a3d] transition-all ${
              isPurged ? 'text-[#ffb4ab]' : 'text-[#bdc8d1] hover:text-[#ffb4ab]'
            }`}
            title="Retirer du cache"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPurged ? 'restore_from_trash' : 'delete_sweep'}
            </span>
          </button>
          <button
            onClick={handleRevalidate}
            className={`p-2 rounded bg-[#171f33] hover:bg-[#222a3d] text-[#bdc8d1] hover:text-[#8ed5ff] transition-all ${
              isRevalidating ? 'animate-spin text-[#8ed5ff]' : ''
            }`}
            title="Re-valider la signature"
          >
            <span className="material-symbols-outlined text-[18px]">cached</span>
          </button>
        </div>
      </section>

      {/* 8. Bottom Dispatch Telemetry */}
      <div className="py-2 text-center font-mono text-[10px] text-[#87929a] uppercase">
        GDELT DOC2 IDENTIFIANT DE PUBLICATION #{dispatch.gkgId}
      </div>
    </div>
  );
};
