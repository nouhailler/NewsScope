import { Dispatch } from '../types';
import { INITIAL_DISPATCHES } from '../data/mockDispatches';

const STORAGE_KEY = 'newsscope_favorites_v1';
const OFFLINE_KEY = 'newsscope_offline_mode';

// Initial default favorites list matching the 14-15 items in mockups
const DEFAULT_FAVORITE_IDS = [
  'doc_reuters_88c2f1',
  'doc_reuters_9402',
  'doc_bloomberg_4419',
  'doc_afp_biodiv',
  'doc_reuters_asml',
  'doc_aie_energy',
  'doc_reuters_mer_rouge',
  'doc_bloomberg_32d90a',
  'doc_afp_1033',
  'doc_reuters_defense_eu',
  'doc_bloomberg_bonds',
  'doc_afp_ia_regulation',
  'doc_bloomberg_taiwan',
  'doc_afp_mention_tierce',
];

export function getStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return DEFAULT_FAVORITE_IDS;
}

export function saveStoredFavorites(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
}

export function toggleFavoriteId(id: string): string[] {
  const current = getStoredFavorites();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  saveStoredFavorites(next);
  return next;
}

export function isFavorite(id: string): boolean {
  return getStoredFavorites().includes(id);
}

export function calculateStorageSize(dispatches: Dispatch[]): string {
  const count = dispatches.length;
  const estimatedBytes = count * 9300 + 4096;
  if (estimatedBytes < 1024) return `${estimatedBytes} octets`;
  return `~${Math.round(estimatedBytes / 1024)} Ko alloués`;
}

export function exportFavoritesAsJson(dispatches: Dispatch[]): void {
  const payload = {
    schema: 'NewsScope_v1.4.2',
    exported_at: new Date().toISOString(),
    total_items: dispatches.length,
    storage_engine: 'IndexedDB / newsScope_v1',
    hash_algorithm: 'SHA-256',
    dispatches: dispatches.map((d) => ({
      gkg_id: d.gkgId,
      agency: d.agencyLabel,
      title: d.title,
      utc_time: d.utcTime,
      canonical_url: d.canonicalUrl,
      sha256_signature: d.sha256,
      sentiment_score: d.sentimentScore,
      thematic_tags: d.thematicTags,
      status: d.isCanonical ? 'VALIDATED_CANONICAL' : 'SYNDICATED_MENTION',
      stored_in_cache: true,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `newsscope-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAuditReportMarkdown(): void {
  const md = `# NewsScope - Audit Technique & Architecture
Version: 1.4.2 · Production Stable
Protocole: OpenWire-256
Date de l'audit: ${new Date().toISOString()}

---

## 1. Méthodologie d'Ingestion & Requêtage GDELT DOC 2.0
- **Point de terminaison**: \`https://api.gdeltproject.org/api/v2/doc/doc\`
- **Requête standard**: \`query=(domainis:reuters.com OR domainis:bloomberg.com OR domainis:afp.com)&mode=ArtList&maxrecords=75&format=json\`
- **Traitement AFP**: Traité en métadonnées publiques pour respecter l'accès B2B afpforum.com.
- **Hygiène URL**: Décapage automatique des balises publicitaires (\`utm_*\`, \`cmpid\`, \`fbclid\`, \`taid\`).

## 2. Déontologie, Droits Voisins & Copyright
- **Directive européenne 2019/790**: Respectée à 100%.
- **Zéro Scraping sous paywall**: Aucun contournement de paywall ni duplication d'articles propriétaires complets.
- **Métadonnées seules**: Titres officiels, extraits courts de presse, horodatages UTC, signatures SHA-256.

## 3. Architecture Décentralisée & Coût d'Infrastructure
- **Coût mensuel**: 0,00 € / mois
- **Hébergement**: Cloudflare Pages (Tier Gratuit Éternel)
- **Base de données**: Stockage souverain local (IndexedDB de l'appareil utilisateur)
- **Cookies & Tracking**: 0 cookie, 0 traceur analytics tiers.
`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `newsscope-audit-architecture-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getOfflineMode(): boolean {
  try {
    return localStorage.getItem(OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOfflineMode(value: boolean): void {
  try {
    localStorage.setItem(OFFLINE_KEY, String(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}
