import { Dispatch, FilterState } from '../types';
import { normalizeGdeltArticle, RawGdeltArticle } from './gdeltNormalizer';
import { saveDispatchToIndexedDB } from '../utils/indexedDB';

export const GDELT_DIRECT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
export const GDELT_PROXY_URL = '/api/gdelt';
export const MIN_COOLDOWN_MS = 5000;

let lastFetchTimestamp = 0;
let isRequestInProgress = false;

export interface FetchResult {
  success: boolean;
  dispatches: Dispatch[];
  httpStatus: number | null;
  latencyMs: number;
  error: string | null;
  errorCategory?: 'CORS' | 'RATE_LIMIT' | 'TIMEOUT' | 'NOT_FOUND' | 'SERVER_ERROR' | 'NETWORK' | 'INVALID_JSON' | 'EMPTY' | null;
  rateLimited: boolean;
  totalArticlesCount: number;
  endpointUsed?: string;
  isProxy?: boolean;
}

/**
 * Réinitialise le délai de cooldown (exclusivement pour les environnements de test)
 */
export function resetRateLimitCooldownForTests(): void {
  lastFetchTimestamp = 0;
  isRequestInProgress = false;
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
 * Traite les erreurs HTTP, 429, timeouts, repli proxy/direct, et concurrence.
 */
export async function fetchLiveGdeltDispatches(
  filters?: Partial<FilterState>,
  customFetch?: typeof fetch
): Promise<FetchResult> {
  const fetchFn = customFetch || (typeof window !== 'undefined' ? window.fetch.bind(window) : fetch);
  const now = Date.now();
  const timeSinceLast = now - lastFetchTimestamp;

  // 1. Verrou anti-concurrence : interdit les requêtes simultanées
  if (isRequestInProgress) {
    return {
      success: false,
      dispatches: [],
      httpStatus: null,
      latencyMs: 0,
      rateLimited: false,
      errorCategory: 'RATE_LIMIT',
      error: 'Une requête vers GDELT est déjà en cours d’exécution. Veuillez patienter.',
      totalArticlesCount: 0,
    };
  }

  // 2. Respect strict de la limitation de débit GDELT (1 requête / 5s)
  if (lastFetchTimestamp > 0 && timeSinceLast < MIN_COOLDOWN_MS) {
    const remainingSecs = Math.ceil((MIN_COOLDOWN_MS - timeSinceLast) / 1000);
    return {
      success: false,
      dispatches: [],
      httpStatus: 429,
      latencyMs: 0,
      rateLimited: true,
      errorCategory: 'RATE_LIMIT',
      error: `Limitation de débit GDELT active : veuillez patienter ${remainingSecs} seconde(s) avant la prochaine requête.`,
      totalArticlesCount: 0,
    };
  }

  isRequestInProgress = true;
  lastFetchTimestamp = Date.now();
  const startTime = Date.now();

  const proxyUrl = buildGdeltQueryUrl(filters, true);
  const directUrl = buildGdeltQueryUrl(filters, false);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);

    let res: Response | null = null;
    let endpointUsed = proxyUrl;
    let isProxy = true;

    // Tentative 1 : via le proxy local /api/gdelt
    let proxyFailed = false;
    try {
      const proxyRes = await fetchFn(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      // Si le proxy renvoie 404 (ex: environnement statique de production sans proxy serveur)
      if (proxyRes.status === 404) {
        proxyFailed = true;
      } else {
        res = proxyRes;
      }
    } catch (proxyErr: any) {
      if (proxyErr.name === 'AbortError' || controller.signal.aborted) {
        clearTimeout(timeout);
        const latencyMs = Date.now() - startTime;
        return {
          success: false,
          dispatches: [],
          httpStatus: null,
          latencyMs,
          rateLimited: false,
          errorCategory: 'TIMEOUT',
          error: 'Délai d’attente dépassé (Timeout 8.5s vers GDELT).',
          totalArticlesCount: 0,
          endpointUsed: proxyUrl,
          isProxy: true,
        };
      }
      proxyFailed = true;
    }

    // Tentative 2 : repli direct si le proxy est indisponible ou a retourné 404
    if (proxyFailed) {
      endpointUsed = directUrl;
      isProxy = false;
      try {
        res = await fetchFn(directUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
      } catch (directErr: any) {
        clearTimeout(timeout);
        const latencyMs = Date.now() - startTime;
        if (directErr.name === 'AbortError' || controller.signal.aborted) {
          return {
            success: false,
            dispatches: [],
            httpStatus: null,
            latencyMs,
            rateLimited: false,
            errorCategory: 'TIMEOUT',
            error: 'Délai d’attente dépassé (Timeout 8.5s vers GDELT).',
            totalArticlesCount: 0,
            endpointUsed,
            isProxy: false,
          };
        }
        const isCORS = directErr.message?.includes('Failed to fetch') || directErr.name === 'TypeError';
        return {
          success: false,
          dispatches: [],
          httpStatus: null,
          latencyMs,
          rateLimited: false,
          errorCategory: isCORS ? 'CORS' : 'NETWORK',
          error: isCORS
            ? 'Erreur CORS navigateur / Proxy requis : GDELT n’autorise pas les appels directs cross-origin. Un proxy /api/gdelt (serveur ou Edge) est nécessaire.'
            : `Erreur de connexion directe : ${directErr.message || 'Hôte GDELT inaccessible'}`,
          totalArticlesCount: 0,
          endpointUsed,
          isProxy: false,
        };
      }
    }

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!res) {
      return {
        success: false,
        dispatches: [],
        httpStatus: null,
        latencyMs,
        rateLimited: false,
        errorCategory: 'NETWORK',
        error: 'Échec de connexion : Aucune réponse réseau n’a pu être obtenue.',
        totalArticlesCount: 0,
        endpointUsed,
        isProxy,
      };
    }

    // Gestion explicite du HTTP 429
    if (res.status === 429) {
      let errDetail = 'Veuillez limiter vos requêtes à 1 toutes les 5 secondes.';
      try {
        const text = await res.text();
        if (text) errDetail = text.slice(0, 150);
      } catch {
        // silence text parsing
      }
      return {
        success: false,
        dispatches: [],
        httpStatus: 429,
        latencyMs,
        rateLimited: true,
        errorCategory: 'RATE_LIMIT',
        error: `GDELT 429 (Trop de requêtes) : ${errDetail}`,
        totalArticlesCount: 0,
        endpointUsed,
        isProxy,
      };
    }

    // Traitement des autres erreurs HTTP (ex: 404, 500, 502, 503)
    if (!res.ok) {
      const is5xx = res.status >= 500 && res.status < 600;
      const is404 = res.status === 404;
      return {
        success: false,
        dispatches: [],
        httpStatus: res.status,
        latencyMs,
        rateLimited: false,
        errorCategory: is404 ? 'NOT_FOUND' : is5xx ? 'SERVER_ERROR' : 'NETWORK',
        error: `Erreur HTTP ${res.status}: ${res.statusText || 'Réponse serveur non valide'}`,
        totalArticlesCount: 0,
        endpointUsed,
        isProxy,
      };
    }

    // Validation du format JSON
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
        errorCategory: 'INVALID_JSON',
        error: 'Réponse GDELT invalide : le serveur n’a pas renvoyé de JSON valide.',
        totalArticlesCount: 0,
        endpointUsed,
        isProxy,
      };
    }

    const rawArticles = Array.isArray(data.articles) ? data.articles : [];

    // Déduplication par URL stricte et rejet des articles sans URL valide
    const seenUrls = new Set<string>();
    const normalized: Dispatch[] = [];

    for (let i = 0; i < rawArticles.length; i++) {
      const item = rawArticles[i];
      const dispatch = normalizeGdeltArticle(item, i);
      if (!dispatch) {
        // Rejet des articles malformés ou sans URL HTTP valide
        continue;
      }
      if (!seenUrls.has(dispatch.canonicalUrl)) {
        seenUrls.add(dispatch.canonicalUrl);
        normalized.push(dispatch);
        // Sauvegarde asynchrone dans IndexedDB
        saveDispatchToIndexedDB(dispatch).catch(console.warn);
      }
    }

    const isEmpty = normalized.length === 0;

    return {
      success: !isEmpty,
      dispatches: normalized,
      httpStatus: res.status,
      latencyMs,
      rateLimited: false,
      errorCategory: isEmpty ? 'EMPTY' : null,
      error: isEmpty ? 'Aucun article trouvé pour les critères sélectionnés.' : null,
      totalArticlesCount: normalized.length,
      endpointUsed,
      isProxy,
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
      errorCategory: isTimeout ? 'TIMEOUT' : 'NETWORK',
      error: isTimeout
        ? 'Délai d’attente dépassé (Timeout 8.5s vers GDELT).'
        : `Erreur réseau : ${err.message || 'Impossible de joindre le service GDELT'}`,
      totalArticlesCount: 0,
      endpointUsed: proxyUrl,
      isProxy: true,
    };
  } finally {
    isRequestInProgress = false;
  }
}
