export type AgencyId = 'reuters' | 'bloomberg' | 'afp' | 'aie';

export interface Dispatch {
  id: string;
  agency: AgencyId;
  agencyLabel: string;
  agencyClass: string;
  isCanonical: boolean;
  isVerified: boolean;
  isThirdPartyMention?: boolean;
  thirdPartySource?: string;
  thirdPartyWarning?: string;
  timestamp: string;
  timeAgo: string;
  utcTime: string;
  title: string;
  kicker?: string;
  excerpt: string;
  quote?: string;
  bureauDesk?: string;
  category: string;
  thematicTags: string[];
  sha256: string;
  canonicalUrl: string;
  cleanedUrl: string;
  removedTrackersCount: number;
  gkgId: string;
  confidenceScore: number;
  sentimentScore: number;
  sentimentLabel: string;
  mediaVelocity: number;
  mediaImage?: string;
  mediaCaption?: string;
  mediaRawRes?: string;
  analystNote?: string;
  offlineAvailable: boolean;
  language: 'fra' | 'eng';
  packetSize: string;
  wordCount: number;
  marketMetric?: {
    label: string;
    value: string;
    change: string;
    isPositive: boolean;
  };
  hasSparkline?: boolean;
}

export type ActiveTab = 'flux-direct' | 'favoris' | 'filtres' | 'a-propos' | 'detail';

export interface FilterState {
  agencies: {
    reuters: boolean;
    bloomberg: boolean;
    afp: boolean;
  };
  excludeThirdParty: boolean;
  keyword: string;
  timeWindow: '6h' | '24h' | '3d' | '7d' | '30d' | 'manual';
  sortMode: 'recent' | 'relevance';
  startDate: string;
  endDate: string;
  language: 'FR' | 'EN' | 'ALL';
  batchLimit: number;
  activeTopics: string[];
  urlSanitization: boolean;
}
