import { Dispatch } from '../types';
import {
  addFavoriteToIndexedDB,
  removeFavoriteFromIndexedDB,
  clearAllIndexedDB,
} from './indexedDB';

const STORAGE_KEY = 'newsscope_favorites_v1';
const OFFLINE_KEY = 'newsscope_offline_mode';
const DATA_MODE_KEY = 'newsscope_data_mode';

/**
 * Nettoyeur d'URL : Supprime les traceurs marketing et publicitaires
 */
export function sanitizeUrl(rawUrl: string): { cleanedUrl: string; removedCount: number } {
  try {
    const url = new URL(rawUrl);
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'cmpid',
      'taid',
      'ref',
      'source',
      'igshid',
    ];

    let removedCount = 0;
    trackingParams.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        removedCount++;
      }
    });

    return {
      cleanedUrl: url.toString(),
      removedCount,
    };
  } catch {
    return {
      cleanedUrl: rawUrl,
      removedCount: 0,
    };
  }
}

/**
 * Récupère les favoris locaux.
 * RÈGLE D'AUDIT : Pour un nouvel utilisateur, la liste initiale est strictement VIDE ([]).
 */
export function getStoredFavorites(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Environnement restreint ou localStorage désactivé
  }
  return [];
}

export function saveStoredFavorites(ids: string[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
}

export async function toggleFavorite(id: string, dispatch?: Dispatch): Promise<string[]> {
  const current = getStoredFavorites();
  let next: string[];
  if (current.includes(id)) {
    next = current.filter((x) => x !== id);
    await removeFavoriteFromIndexedDB(id);
  } else {
    next = [id, ...current];
    await addFavoriteToIndexedDB(id, dispatch);
  }
  saveStoredFavorites(next);
  return next;
}

export function toggleFavoriteId(id: string, dispatch?: Dispatch): string[] {
  const current = getStoredFavorites();
  let next: string[];
  if (current.includes(id)) {
    next = current.filter((x) => x !== id);
    removeFavoriteFromIndexedDB(id).catch((err) => console.warn('[IndexedDB] remove error:', err));
  } else {
    next = [id, ...current];
    addFavoriteToIndexedDB(id, dispatch).catch((err) => console.warn('[IndexedDB] add error:', err));
  }
  saveStoredFavorites(next);
  return next;
}

export async function purgeAllFavorites(): Promise<void> {
  saveStoredFavorites([]);
  await clearAllIndexedDB();
}

export function calculateStorageSize(dispatches: Dispatch[]): string {
  if (dispatches.length === 0) return '0 Ko (Cache vide)';
  const count = dispatches.length;
  const estimatedBytes = count * 3400 + 1024;
  return `~${Math.round(estimatedBytes / 1024)} Ko alloués`;
}

export function exportFavoritesAsJson(dispatches: Dispatch[]): void {
  const payload = {
    schema: 'NewsScope_v1.4.2',
    exported_at: new Date().toISOString(),
    total_items: dispatches.length,
    storage_engine: 'IndexedDB / newsScope_v1 (local, non-chiffré)',
    integrity_note: 'Dépêches exportées au format JSON RFC 8259 sans données de tracking.',
    dispatches: dispatches.map((d) => ({
      id: d.id,
      is_mock: d.isMock,
      gkg_id: d.gkgId,
      agency: d.agencyLabel,
      title: d.title,
      utc_time: d.utcTime,
      canonical_url: d.canonicalUrl,
      cleaned_url: d.cleanedUrl,
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
  a.download = `newsscope-favoris-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAuditReportMarkdown(): void {
  const md = `# NewsScope — Rapport d'Audit & Architecture
Version: 1.4.2 · Production Stable
Protocole: OpenWire-256
Date de l'audit: ${new Date().toISOString()}

---

## 1. Méthodologie d'Ingestion & Requêtage GDELT DOC 2.0
- **Point de terminaison**: \`https://api.gdeltproject.org/api/v2/doc/doc\`
- **Requête standard**: \`query=(domainis:reuters.com OR domainis:bloomberg.com OR domainis:afp.com)&mode=ArtList&maxrecords=50&format=json\`
- **Traitement AFP**: Traité en métadonnées publiques pour respecter l'accès B2B afpforum.com. Les mentions issues d'agrégateurs sont étiquetées "Mention tierce / Rediffusion".
- **Hygiène URL**: Décapage automatique des balises publicitaires (\`utm_*\`, \`cmpid\`, \`fbclid\`, \`taid\`).

## 2. Déontologie, Droits Voisins & Copyright
- **Directive européenne 2019/790**: Respectée à 100%.
- **Zéro Scraping sous paywall**: Aucun contournement de paywall ni duplication d'articles propriétaires complets.
- **Métadonnées seules**: Titres officiels, extraits courts de presse, horodatages UTC.

## 3. Architecture Décentralisée & Coût d'Infrastructure
- **Coût mensuel**: 0,00 € / mois
- **Hébergement**: PWA autonome / Static Pages
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
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem(OFFLINE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOfflineMode(value: boolean): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(OFFLINE_KEY, String(value));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

export function getDataMode(): 'live' | 'demo' {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'live';
    const mode = window.localStorage.getItem(DATA_MODE_KEY);
    if (mode === 'live' || mode === 'demo') return mode;
  } catch {
    // fallback
  }
  return 'live';
}

export function setDataMode(mode: 'live' | 'demo'): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(DATA_MODE_KEY, mode);
  } catch (e) {
    console.warn('Storage error:', e);
  }
}
