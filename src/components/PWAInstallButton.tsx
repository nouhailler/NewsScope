import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (isInstalled) {
    if (variant === 'banner') return null;
    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded bg-[#131b2e] text-emerald-400 font-mono text-[11px] border border-emerald-400/30 ${className}`}
        title="Application installée en mode autonome (PWA)"
      >
        <span className="material-symbols-outlined text-[13px]">verified</span>
        <span>PWA ACTIVE</span>
      </div>
    );
  }

  if (isIOS) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222a3d] text-[#8ed5ff] text-xs font-['Geist'] border border-[#38bdf8]/30">
          <span className="material-symbols-outlined text-[15px]">ios_share</span>
          <span>Pour installer sur iOS : Partager → « Sur l'écran d'accueil »</span>
        </div>
      );
    }
    return null;
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={install}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#38bdf8] hover:bg-[#8ed5ff] text-[#00354a] font-['Geist'] text-xs font-bold transition-all shadow-sm ${className}`}
      title="Installer NewsScope comme application native autonome"
    >
      <span className="material-symbols-outlined text-[15px]">install_mobile</span>
      <span>Installer PWA</span>
    </button>
  );
};
