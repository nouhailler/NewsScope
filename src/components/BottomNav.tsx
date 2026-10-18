import React from 'react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  favoritesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  favoritesCount,
}) => {
  const tabs = [
    {
      id: 'flux-direct' as ActiveTab,
      label: 'Flux Direct',
      shortLabel: 'Flux',
      icon: 'rss_feed',
    },
    {
      id: 'favoris' as ActiveTab,
      label: 'Favoris',
      shortLabel: 'Favoris',
      icon: 'bookmark',
      badge: favoritesCount,
    },
    {
      id: 'filtres' as ActiveTab,
      label: 'Filtres',
      shortLabel: 'Filtres',
      icon: 'tune',
    },
    {
      id: 'a-propos' as ActiveTab,
      label: 'À propos',
      shortLabel: 'À propos',
      icon: 'policy',
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#060e20]/92 backdrop-blur-xl border-t border-[#222a3d]/70 shadow-[0_-1px_12px_rgba(0,0,0,0.45)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive =
            activeTab === tab.id || (tab.id === 'flux-direct' && activeTab === 'detail');
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 transition-all ${
                isActive
                  ? 'text-[#38bdf8] font-semibold'
                  : 'text-[#bdc8d1] hover:text-[#dae2fd]'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 rounded-full bg-[#ec6a06] text-[#ffdbca] font-mono text-[9px] font-bold leading-none shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="font-['Geist'] text-[11px] tracking-wider uppercase mt-1">
                {tab.shortLabel}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
