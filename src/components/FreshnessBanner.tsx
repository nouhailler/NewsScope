import React from 'react';
import { getFreshnessInfo } from '../utils/dateUtils';

interface FreshnessBannerProps {
  timestamp?: string;
  isMock?: boolean;
  size?: 'compact' | 'normal' | 'detailed';
  className?: string;
}

export const FreshnessBanner: React.FC<FreshnessBannerProps> = ({
  timestamp,
  isMock = false,
  size = 'normal',
  className = '',
}) => {
  const info = getFreshnessInfo(timestamp, new Date(), isMock);

  if (size === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#060e20] border border-[#222a3d] text-xs font-mono ${className}`}
        title={`Date exacte : ${info.fullDateTimeLabel}`}
      >
        <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">schedule</span>
        <span className="text-[#dae2fd] font-bold">{info.dayLabel}</span>
        <span className="text-[#8ed5ff] font-semibold">{info.timeLabel}</span>
        <span className="text-[#87929a]">({info.relativeLabel})</span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${info.badgeContainerClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${info.badgeDotClass}`} />
          {info.freshnessBadgeLabel}
        </span>
      </div>
    );
  }

  if (size === 'detailed') {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#060e20] border border-[#222a3d] shadow-inner ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#38bdf8] shrink-0">
            <span className="material-symbols-outlined text-[19px]">schedule</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-['Geist'] text-xs uppercase tracking-wider text-[#bdc8d1] font-semibold">
                Publication officielle
              </span>
              <span className="text-[#3e484f]">•</span>
              <span className="font-['Geist'] text-xs text-[#87929a]">
                Fraîcheur : {info.relativeLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
              <span className="font-['Newsreader'] text-base font-semibold text-[#dae2fd]">
                {info.dayLabel}
              </span>
              <span className="font-mono text-sm text-[#38bdf8] font-bold">
                {info.timeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${info.badgeContainerClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${info.badgeDotClass}`} />
            <span>{info.freshnessBadgeLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // Normal size (for cards in FluxDirect and Favoris)
  return (
    <div
      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#060e20]/90 border border-[#222a3d] shadow-sm my-1.5 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[15px] text-[#38bdf8] shrink-0">
          calendar_clock
        </span>
        <div className="flex items-baseline gap-1.5 truncate text-xs">
          <span className="font-['Geist'] font-bold text-[#dae2fd] truncate">
            {info.dayLabel}
          </span>
          <span className="font-mono text-[#8ed5ff] font-semibold shrink-0">
            {info.timeLabel}
          </span>
          <span className="font-mono text-[#87929a] text-[11px] shrink-0">
            ({info.relativeLabel})
          </span>
        </div>
      </div>

      <div className="shrink-0">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${info.badgeContainerClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${info.badgeDotClass}`} />
          <span>{info.freshnessBadgeLabel}</span>
        </span>
      </div>
    </div>
  );
};
