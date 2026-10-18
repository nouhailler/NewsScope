import { Dispatch, FilterState } from '../types';
import { normalizeGdeltArticle, RawGdeltArticle } from './gdeltNormalizer';
import { saveDispatchToIndexedDB } from '../utils/indexedDB';

const GDELT_DIRECT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const GDELT_PROXY_URL = '/api/gdelt';
const MIN_COOLDOWN_MS = 5000;

let lastFetchTimestamp = 0;

export interface FetchResult {
  success: boolean;
  dispatches: Dispatch[];
  httpStatus: number | null;
  latencyMs: number;
  error: string | null;
  rateLimited: boolean;
  totalArticlesCount: number;
}

/**
 * Construit la requête GDELT DOC 2.0 à partir des filtres actifs
 */
export function buildGdeltQueryUrl(
  filters?: Partial<FilterState>,
  useProxy = true
): string {
  const baseUrl = useProxy ? GDELT_PROXY_URL : GDELT_DIRECT_URL;
  const domainParts: string[] = [];

  if (filters?.agencies?.reuters ?? true) domainParts.push('domainis:reuters.com');
  if (filters?.agencies?.bloomberg ?? true) domainParts.push('domainis:bloomberg.com');
  if (filters?.agencies?.afp ?? true) domainParts.push('domainis:afp.com');

  const domainQuery = domainParts.length > 0 ? `(${domainParts.join(' OR ')})` : 'domainis:*';
  let fullQuery = domainQuery;

  if (filters?.keyword && filters.keyword.trim().length > 0) {
    fullQuery += ` AND ("${filters.keyword.trim()}")`;
  }

  const timespan = filters?.timeWindow || '24h';
  const sort = filters?.sortMode === 'relevance' ? 'ToneDesc' : 'DateDesc';
  const maxRecords = filters?.batchLimit || 25;

  const params = new URLSearchParams({
    query: fullQuery,
    mode: 'artlist',
    maxrecords: String(maxRecords),
    format: 'json',
    sort,
    timespan,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Récupère les dépêches réelles depuis GDELT DOC 2.0
 */
export async function fetchLiveGdeltDispatches(
  filters?: Partial<FilterState>
): Promise<FetchResult> {
  const now = Date.now();
  const timeSinceLast = now - lastFetchTimestamp;

  // Respect du rate limit GDELT (1 requête / 5s)
  if (lastFetchTimestamp > 0 && timeSinceLast < MIN_COOLDOWN_MS) {
    const remainingSecs = Math.ceil((MIN_COOLDOWN_MS - timeSinceLast) / 1000);
    return {
      success: false,
      dispatches: [],
      httpStatus: 429,
      latencyMs: 0,
      rateLimited: true,
      error: `Limitation de débit GDELT active : veuillez patienter ${remainingSecs} seconde(s) avant la prochaine requête.`,
      totalArticlesCount: 0,
    };
  }

  lastFetchTimestamp = Date.now();
  const startTime = Date.now();

  const queryUrl = buildGdeltQueryUrl(filters, true);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);

    let res: Response;
    try {
      res = await fetch(queryUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch (proxyErr) {
      // Si le proxy local échoue (ex: test direct hors serveur Vite), tentative directe
      const directUrl = buildGdeltQueryUrl(filters, false);
      res = await fetch(directUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    }

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (res.status === 429) {
      const errText = await res.text();
      return {
        success: false,
        dispatches: [],
        httpStatus: 429,
        latencyMs,
        rateLimited: true,
        error: `GDELT 429 (Trop de requêtes) : ${errText.slice(0, 150)}`,
        totalArticlesCount: 0,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        dispatches: [],
        httpStatus: res.status,
        latencyMs,
        rateLimited: false,
        error: `Erreur HTTP ${res.status}: ${res.statusText}`,
        totalArticlesCount: 0,
      };
    }

    const rawText = await res.text();
    let data: { articles?: RawGdeltArticle[] };
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        dispatches: [],
        httpStatus: res.status,
        latencyMs,
        rateLimited: false,
        error: 'Réponse GDELT invalide (format non-JSON).',
        totalArticlesCount: 0,
      };
    }

    const rawArticles = Array.isArray(data.articles) ? data.articles : [];

    // Déduplication par URL
    const seenUrls = new Set<string>();
    const normalized: Dispatch[] = [];

    for (let i = 0; i < rawArticles.length; i++) {
      const item = rawArticles[i];
      if (item.url && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        const dispatch = normalizeGdeltArticle(item, i);
        normalized.push(dispatch);
        // Sauvegarde asynchrone dans IndexedDB
        saveDispatchToIndexedDB(dispatch);
      }
    }

    return {
      success: true,
      dispatches: normalized,
      httpStatus: res.status,
      latencyMs,
      rateLimited: false,
      error: null,
      totalArticlesCount: normalized.length,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      dispatches: [],
      httpStatus: null,
      latencyMs,
      rateLimited: false,
      error: isTimeout
        ? 'Délai d’attente dépassé (Timeout 8.5s vers GDELT).'
        : `Erreur réseau : ${err.message || 'Impossible de joindre le serveur'}`,
      totalArticlesCount: 0,
    };
  }
}
