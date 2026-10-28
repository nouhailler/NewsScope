import { Dispatch, AgencyId } from '../types';
import { sanitizeUrl } from '../utils/storage';

export interface RawGdeltArticle {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

/**
 * Calcul standard et authentique de l'empreinte SHA-256 (FIPS 180-4 / RFC 6234)
 * Renvoie une chaîne hexadécimale de 64 caractères en minuscules.
 */
export function calculateSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let str = ascii + '\x80';
  while (str.length % 64 !== 56) str += '\x00';
  for (let i = 0; i < str.length; i++) {
    const j = str.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength | 0);

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & hash[5]) ^ (~e & hash[6]);
      const temp1 =
        hash[7] +
        s1 +
        ch +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : ((w[i - 16] || 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] || 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = s0 + maj;
      hash = [
        (temp1 + temp2) | 0,
        a,
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Validation et extraction stricte de l'hôte canonique (URL.hostname)
 * Élimine le préfixe www. et rejette les entrées invalides
 */
export function extractHostname(urlOrDomain: string): string | null {
  if (!urlOrDomain || typeof urlOrDomain !== 'string') return null;
  const trimmed = urlOrDomain.trim();
  if (!trimmed) return null;

  try {
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const parsed = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname || null;
  } catch {
    return null;
  }
}

/**
 * Vérification stricte d'appartenance à un domaine d'agence
 * Autorise soit le domaine exact, soit un sous-domaine légitime (ex: jp.reuters.com).
 * Rejette strictement les attaques suffix/poisoning (ex: reuters.com.example.org, fake-bloomberg.com).
 */
export function isLegitimateAgencyDomain(hostname: string, targetDomain: string): boolean {
  if (!hostname || !targetDomain) return false;
  const cleanHost = hostname.toLowerCase();
  const cleanTarget = targetDomain.toLowerCase();
  if (cleanHost === cleanTarget) return true;
  if (cleanHost.endsWith(`.${cleanTarget}`)) return true;
  return false;
}

/**
 * Vérifie si une chaîne est une URL HTTP/HTTPS valide et exploitable
 */
export function isValidHttpUrl(urlStr?: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convertit une date GDELT "YYYYMMDDTHHMMSSZ" ou "YYYYMMDDHHMMSS" en objet Date
 * Renvoie une date valide ou null si la date est absente ou corrompue.
 */
export function parseGdeltDate(seendate?: string): { date: Date; isValid: boolean } {
  if (!seendate || typeof seendate !== 'string') {
    return { date: new Date(0), isValid: false };
  }

  // Nettoyage des séparateurs éventuels (T, Z)
  const cleaned = seendate.replace(/[^0-9]/g, '');
  if (cleaned.length < 14) {
    return { date: new Date(0), isValid: false };
  }

  try {
    const year = parseInt(cleaned.slice(0, 4), 10);
    const month = parseInt(cleaned.slice(4, 6), 10) - 1;
    const day = parseInt(cleaned.slice(6, 8), 10);
    const hour = parseInt(cleaned.slice(8, 10), 10);
    const min = parseInt(cleaned.slice(10, 12), 10);
    const sec = parseInt(cleaned.slice(12, 14), 10);

    if (
      year < 1970 ||
      year > 2100 ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31 ||
      hour < 0 ||
      hour > 23 ||
      min < 0 ||
      min > 59 ||
      sec < 0 ||
      sec > 59
    ) {
      return { date: new Date(0), isValid: false };
    }

    const d = new Date(Date.UTC(year, month, day, hour, min, sec));
    if (isNaN(d.getTime())) {
      return { date: new Date(0), isValid: false };
    }
    return { date: d, isValid: true };
  } catch {
    return { date: new Date(0), isValid: false };
  }
}

/**
 * Calcule le temps relatif en français à partir d'une date
 */
export function formatRelativeTime(date: Date, now: Date = new Date(), isValidDate: boolean = true): string {
  if (!isValidDate || date.getTime() === 0) {
    return 'Date inconnue';
  }
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'À l’instant';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'À l’instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Il y a ${diffDays} j`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Il y a ${diffMonths} mois`;
}

/**
 * Détermine l'agence et la conformité canonique avec validation stricte
 * Règle d'audit : Ne jamais attribuer l'AFP aux sources inconnues. Utiliser explicitement 'other'.
 */
export function resolveAgencyAndCanon(rawUrlOrDomain?: string): {
  agency: AgencyId;
  agencyLabel: string;
  agencyClass: string;
  isCanonical: boolean;
  isThirdPartyMention: boolean;
  thirdPartySource?: string;
  thirdPartyWarning?: string;
} {
  const hostname = extractHostname(rawUrlOrDomain || '');

  if (hostname && isLegitimateAgencyDomain(hostname, 'reuters.com')) {
    return {
      agency: 'reuters',
      agencyLabel: 'REUTERS',
      agencyClass: 'bg-[#ffb690]/20 text-[#ffb690] border border-[#ffb690]/30',
      isCanonical: true,
      isThirdPartyMention: false,
    };
  }

  if (hostname && isLegitimateAgencyDomain(hostname, 'bloomberg.com')) {
    return {
      agency: 'bloomberg',
      agencyLabel: 'BLOOMBERG',
      agencyClass: 'bg-[#e1bfff]/20 text-[#e1bfff] border border-[#e1bfff]/30',
      isCanonical: true,
      isThirdPartyMention: false,
    };
  }

  if (hostname && isLegitimateAgencyDomain(hostname, 'afp.com')) {
    return {
      agency: 'afp',
      agencyLabel: 'AFP',
      agencyClass: 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30',
      isCanonical: true,
      isThirdPartyMention: false,
    };
  }

  // Source tierce ou inconnue : classée comme 'other' (JAMAIS attribuée à AFP par défaut)
  const displaySource = hostname || 'source-tierce.eu';
  return {
    agency: 'other',
    agencyLabel: displaySource.toUpperCase(),
    agencyClass: 'bg-[#87929a]/20 text-[#bdc8d1] border border-[#87929a]/30',
    isCanonical: false,
    isThirdPartyMention: true,
    thirdPartySource: displaySource,
    thirdPartyWarning: `Dépêche relayée par la source tierce "${displaySource}". L'origine éditoriale officielle n'est pas vérifiée sur le domaine canonique d'une agence accréditée.`,
  };
}

/**
 * Normalise un article brut GDELT DOC 2.0 en Dispatch
 * Rejette (renvoie null) si l'article ne contient pas d'URL HTTP/HTTPS valide.
 * Ne fabrique aucun chiffre arbitraire (sentiment, confiance, etc.).
 */
export function normalizeGdeltArticle(
  raw: RawGdeltArticle,
  index: number
): Dispatch | null {
  // Rejet obligatoire si absence d'URL valide
  if (!raw.url || !isValidHttpUrl(raw.url)) {
    return null;
  }

  const rawUrl = raw.url;
  const { cleanedUrl, removedCount } = sanitizeUrl(rawUrl);
  const { date: parsedDate, isValid: isValidDate } = parseGdeltDate(raw.seendate);

  // Utilisation de l'URL réelle pour l'analyse de domaine
  const agencyInfo = resolveAgencyAndCanon(rawUrl);
  const title = (raw.title || 'Dépêche sans titre').trim();

  // Empreinte SHA-256 authentique (RFC 6234)
  const sha256 = calculateSha256(`${rawUrl}::${title}`);
  const id = `gdelt_${raw.seendate || 'nodate'}_${sha256.slice(0, 12)}_${index}`;

  const lang = (raw.language || '').toLowerCase().startsWith('fra') ? 'fra' : 'eng';

  return {
    id,
    isMock: false,
    agency: agencyInfo.agency,
    agencyLabel: agencyInfo.agencyLabel,
    agencyClass: agencyInfo.agencyClass,
    isCanonical: agencyInfo.isCanonical,
    isVerified: agencyInfo.isCanonical,
    isThirdPartyMention: agencyInfo.isThirdPartyMention,
    thirdPartySource: agencyInfo.thirdPartySource,
    thirdPartyWarning: agencyInfo.thirdPartyWarning,
    timestamp: isValidDate ? parsedDate.toISOString() : '',
    hasInvalidDate: !isValidDate,
    timeAgo: formatRelativeTime(parsedDate, new Date(), isValidDate),
    utcTime: isValidDate ? `${parsedDate.toISOString().slice(11, 19)} UTC` : 'Date inconnue',
    title,
    kicker: agencyInfo.isThirdPartyMention
      ? `Syndication • ${agencyInfo.agencyLabel}`
      : `Dépêche Directe GDELT DOC 2.0 (${agencyInfo.agencyLabel})`,
    excerpt: `Dépêche indexée par GDELT DOC 2.0 (${raw.sourcecountry || 'International'}). Seules les métadonnées publiques sont indexées conformément à la directive UE 2019/790.`,
    bureauDesk: agencyInfo.isCanonical ? `DESK OFFICIEL (${agencyInfo.agencyLabel})` : 'SOURCE TIERCE',
    category: 'ACTUALITÉ MONDIALE',
    thematicTags: [
      `#${agencyInfo.agency.toUpperCase()}_WIRE`,
      '#GDELT_DOC2',
      `#${(raw.sourcecountry || 'WORLD').toUpperCase()}`,
    ],
    sha256,
    contentHash: sha256,
    canonicalUrl: rawUrl,
    cleanedUrl,
    removedTrackersCount: removedCount,
    gkgId: raw.seendate ? `GDELT-${raw.seendate}` : `GDELT-${sha256.slice(0, 10)}`,
    // Métadonnées non fournies par le format artlist de GDELT : laissées undefined
    confidenceScore: undefined,
    sentimentScore: undefined,
    sentimentLabel: undefined,
    mediaVelocity: undefined,
    mediaImage: raw.socialimage,
    mediaCaption: raw.domain ? `Source : ${raw.domain}` : undefined,
    offlineAvailable: true,
    language: lang,
    packetSize: undefined,
    wordCount: undefined,
  };
}
