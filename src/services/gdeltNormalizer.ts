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
 * Encode une chaîne de caractères en tableau d'octets UTF-8
 */
export function utf8Encode(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      utf8.push(charcode);
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    } else {
      // Paire de substitution surrogate
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

/**
 * Calcul standard et authentique de l'empreinte SHA-256 (FIPS 180-4 / RFC 6234)
 * Opère rigoureusement sur les octets encodés en UTF-8 pour supporter l'Unicode
 * et les caractères accentués de la langue française.
 * Renvoie une chaîne hexadécimale de 64 caractères en minuscules.
 */
export function calculateSha256(input: string): string {
  const bytes = utf8Encode(input);
  const bitLength = bytes.length * 8;

  // Calcul du padding conforme FIPS 180-4 :
  // octets originaux + 0x80 + 0x00... jusqu'à longueur % 64 == 56 + 8 octets de longueur en bits
  const remainder = (bytes.length + 9) % 64;
  const paddingLength = remainder === 0 ? 0 : 64 - remainder;
  const totalLength = bytes.length + 1 + paddingLength + 8;

  const buffer = new Uint8Array(totalLength);
  buffer.set(bytes, 0);
  buffer[bytes.length] = 0x80;

  // Longueur sur 64 bits en gros-boutiste (big-endian)
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = (bitLength & 0xffffffff) >>> 0;
  const view = new DataView(buffer.buffer);
  view.setUint32(totalLength - 8, highBits, false);
  view.setUint32(totalLength - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

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

  const w = new Uint32Array(64);

  function rightRotate(x: number, n: number) {
    return (x >>> n) | (x << (32 - n));
  }

  for (let offset = 0; offset < totalLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((num) => num.toString(16).padStart(8, '0'))
    .join('');
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
  sourceDomain: string;
  thirdPartySource?: string;
  thirdPartyWarning?: string;
} {
  const hostname = extractHostname(rawUrlOrDomain || '');
  const domain = hostname || 'source-inconnue.eu';

  if (hostname && isLegitimateAgencyDomain(hostname, 'reuters.com')) {
    return {
      agency: 'reuters',
      agencyLabel: 'REUTERS',
      agencyClass: 'bg-[#ffb690]/20 text-[#ffb690] border border-[#ffb690]/30',
      isCanonical: true,
      isThirdPartyMention: false,
      sourceDomain: domain,
    };
  }

  if (hostname && isLegitimateAgencyDomain(hostname, 'bloomberg.com')) {
    return {
      agency: 'bloomberg',
      agencyLabel: 'BLOOMBERG',
      agencyClass: 'bg-[#e1bfff]/20 text-[#e1bfff] border border-[#e1bfff]/30',
      isCanonical: true,
      isThirdPartyMention: false,
      sourceDomain: domain,
    };
  }

  if (hostname && isLegitimateAgencyDomain(hostname, 'afp.com')) {
    return {
      agency: 'afp',
      agencyLabel: 'AFP',
      agencyClass: 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30',
      isCanonical: true,
      isThirdPartyMention: false,
      sourceDomain: domain,
    };
  }

  // Source tierce ou inconnue : classée comme 'other' (JAMAIS attribuée à AFP par défaut)
  return {
    agency: 'other',
    agencyLabel: domain.toUpperCase(),
    agencyClass: 'bg-[#87929a]/20 text-[#bdc8d1] border border-[#87929a]/30',
    isCanonical: false,
    isThirdPartyMention: true,
    sourceDomain: domain,
    thirdPartySource: domain,
    thirdPartyWarning: `Dépêche relayée par la source tierce "${domain}". L'origine éditoriale officielle n'est pas vérifiée sur le domaine canonique d'une agence accréditée.`,
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

  // Empreinte SHA-256 authentique (FIPS 180-4 / RFC 6234)
  const sha256 = calculateSha256(`${rawUrl}::${title}`);
  // L'identifiant applicatif stable est distinct du hash cryptographique
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
    sourceDomain: agencyInfo.sourceDomain,
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
    bureauDesk: agencyInfo.isCanonical ? `DESK OFFICIEL (${agencyInfo.agencyLabel})` : `SOURCE TIERCE (${agencyInfo.sourceDomain})`,
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
    mediaCredit: agencyInfo.isCanonical ? agencyInfo.agencyLabel : agencyInfo.sourceDomain,
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
