/**
 * NewsScope Wire — Utilitaire d'Analyse de Fraîcheur & Formatage Date / Heure
 * 
 * Permet d'identifier immédiatement si une dépêche est ultra-fraîche (< 1h),
 * récente (< 6h), publiée aujourd'hui, hier, ou s'il s'agit d'une archive / donnée de test.
 */

export interface FreshnessInfo {
  date: Date;
  dayLabel: string;
  timeLabel: string;
  fullDateTimeLabel: string;
  relativeLabel: string;
  freshnessCategory: 'breaking' | 'fresh' | 'today' | 'yesterday' | 'older' | 'test-data';
  freshnessBadgeLabel: string;
  badgeContainerClass: string;
  badgeDotClass: string;
  isFresh: boolean;
  hoursAgo: number;
}

const FRENCH_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FRENCH_MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

export function getFreshnessInfo(
  timestampStr?: string,
  now: Date = new Date(),
  isMock: boolean = false
): FreshnessInfo {
  let date: Date;
  try {
    if (!timestampStr) {
      date = new Date();
    } else {
      date = new Date(timestampStr);
      if (isNaN(date.getTime())) {
        date = new Date();
      }
    }
  } catch {
    date = new Date();
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const hoursStr = String(date.getUTCHours()).padStart(2, '0');
  const minsStr = String(date.getUTCMinutes()).padStart(2, '0');
  const secsStr = String(date.getUTCSeconds()).padStart(2, '0');
  const timeLabel = `${hoursStr}:${minsStr}:${secsStr} UTC`;

  const isSameDay =
    now.getUTCFullYear() === date.getUTCFullYear() &&
    now.getUTCMonth() === date.getUTCMonth() &&
    now.getUTCDate() === date.getUTCDate();

  const isYesterday =
    now.getUTCFullYear() === date.getUTCFullYear() &&
    now.getUTCMonth() === date.getUTCMonth() &&
    now.getUTCDate() - date.getUTCDate() === 1;

  let dayLabel: string;
  if (isSameDay) {
    dayLabel = "Aujourd'hui";
  } else if (isYesterday) {
    dayLabel = 'Hier';
  } else {
    const dayName = FRENCH_DAYS[date.getUTCDay()];
    const dayNum = date.getUTCDate();
    const monthName = FRENCH_MONTHS[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    dayLabel = `${dayName} ${dayNum} ${monthName} ${year}`;
  }

  // Relative label
  let relativeLabel: string;
  if (diffMins < 1) {
    relativeLabel = 'À l’instant';
  } else if (diffMins < 60) {
    relativeLabel = `Il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    relativeLabel = `Il y a ${diffHours} h`;
  } else if (diffDays < 30) {
    relativeLabel = `Il y a ${diffDays} j`;
  } else {
    const monthsAgo = Math.floor(diffDays / 30);
    relativeLabel = `Il y a ${monthsAgo} mois`;
  }

  const fullDateTimeLabel = `${dayLabel} • ${timeLabel}`;

  // Categorize freshness
  if (isMock || diffDays > 30) {
    return {
      date,
      dayLabel,
      timeLabel,
      fullDateTimeLabel,
      relativeLabel,
      freshnessCategory: 'test-data',
      freshnessBadgeLabel: isMock ? 'DONNÉE DE DÉMO (SYNTHÉTIQUE)' : 'ARCHIVE ANCIENNE',
      badgeContainerClass: 'bg-amber-500/15 text-amber-300 border border-amber-400/30',
      badgeDotClass: 'bg-amber-400',
      isFresh: false,
      hoursAgo: Math.max(0, diffHours),
    };
  }

  if (diffMins >= 0 && diffMins < 60) {
    return {
      date,
      dayLabel,
      timeLabel,
      fullDateTimeLabel,
      relativeLabel,
      freshnessCategory: 'breaking',
      freshnessBadgeLabel: '⚡ ULTRA-FRAIS (< 1H)',
      badgeContainerClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold',
      badgeDotClass: 'bg-emerald-400 animate-ping',
      isFresh: true,
      hoursAgo: 0,
    };
  }

  if (diffHours >= 1 && diffHours < 6) {
    return {
      date,
      dayLabel,
      timeLabel,
      fullDateTimeLabel,
      relativeLabel,
      freshnessCategory: 'fresh',
      freshnessBadgeLabel: `🟢 RÉCENT (${relativeLabel})`,
      badgeContainerClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/30',
      badgeDotClass: 'bg-emerald-400',
      isFresh: true,
      hoursAgo: diffHours,
    };
  }

  if (isSameDay || diffHours < 24) {
    return {
      date,
      dayLabel,
      timeLabel,
      fullDateTimeLabel,
      relativeLabel,
      freshnessCategory: 'today',
      freshnessBadgeLabel: `AUJOURD'HUI • ${timeLabel}`,
      badgeContainerClass: 'bg-[#004965]/40 text-[#8ed5ff] border border-[#38bdf8]/40',
      badgeDotClass: 'bg-[#38bdf8]',
      isFresh: true,
      hoursAgo: diffHours,
    };
  }

  if (isYesterday || diffHours < 48) {
    return {
      date,
      dayLabel,
      timeLabel,
      fullDateTimeLabel,
      relativeLabel,
      freshnessCategory: 'yesterday',
      freshnessBadgeLabel: 'HIER',
      badgeContainerClass: 'bg-[#222a3d] text-[#dae2fd] border border-[#3e484f]',
      badgeDotClass: 'bg-[#bdc8d1]',
      isFresh: false,
      hoursAgo: diffHours,
    };
  }

  return {
    date,
    dayLabel,
    timeLabel,
    fullDateTimeLabel,
    relativeLabel,
    freshnessCategory: 'older',
    freshnessBadgeLabel: `ARCHIVE (${relativeLabel})`,
    badgeContainerClass: 'bg-[#131b2e] text-[#87929a] border border-[#222a3d]',
    badgeDotClass: 'bg-[#87929a]',
    isFresh: false,
    hoursAgo: diffHours,
  };
}
