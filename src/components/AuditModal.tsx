import React from 'react';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl max-h-[88vh] flex flex-col bg-[#0b1326] rounded-xl overflow-hidden shadow-2xl border border-[#38bdf8]/30 font-['Geist'] text-xs text-[#dae2fd]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#171f33] p-4 flex items-center justify-between border-b border-[#222a3d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 flex items-center justify-center text-[#38bdf8]">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div>
              <h2 className="font-['Newsreader'] text-base font-semibold text-[#dae2fd]">
                Audit Initial Phase 0 • Spécification
              </h2>
              <span className="font-mono text-[10px] text-[#bdc8d1]">
                VALIDATION CONFORMITÉ & RÉSILIENCE SOUVERAINE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#222a3d] text-[#bdc8d1] hover:text-[#dae2fd] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 leading-relaxed font-['Source_Serif_4'] text-xs sm:text-[13px] text-[#bdc8d1]">
          <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d] space-y-1.5 font-['Geist']">
            <span className="text-[#38bdf8] font-bold uppercase text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Conclusions de l'Audit Phase 0
            </span>
            <p className="text-xs text-[#dae2fd]">
              L'architecture de NewsScope Wire a été soumise à une vérification complète
              d'isolation cryptographique, de respect des droits voisins (UE 2019/790) et
              d'intégrité PWA.
            </p>
          </div>

          <h3 className="font-['Newsreader'] text-sm font-semibold text-[#dae2fd] pt-1">
            1. Zéro Tiers & Zéro Cookie (RGPD Strict)
          </h3>
          <p>
            L'application n'injecte aucun pixel traceur, script d'audience commercial ou cookie
            de session. Toutes les métadonnées de lecture sont traitées en mémoire isolée et
            conservées localement dans le partitionnement IndexedDB du navigateur client.
          </p>

          <h3 className="font-['Newsreader'] text-sm font-semibold text-[#dae2fd] pt-1">
            2. Déontologie Éditoriale & Anti-Paywall Bypassing
          </h3>
          <p>
            NewsScope respecte l'article 15 de la directive européenne 2019/790 : seuls les courts
            extraits officiels, titres canoniques et métadonnées d'attribution sont affichés.
            Aucun contenu sous paywall n'est scrappé ou republié intégralement. Les utilisateurs
            sont systématiquement redirigés vers les sources originales par liens assainis de tout
            traceur.
          </p>

          <h3 className="font-['Newsreader'] text-sm font-semibold text-[#dae2fd] pt-1">
            3. Souveraineté & Coût 0 € / Mois
          </h3>
          <p>
            Grâce à l'exécution 100% côté client combinée au réseau de bordure Cloudflare Pages
            (fonctions Edge sans logs), le coût d'infrastructure est strictement nul et la
            résilience face aux coupures réseau est absolue via le cache Service Worker.
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#171f33] flex items-center justify-between border-t border-[#222a3d]">
          <span className="font-mono text-[10px] text-[#87929a]">
            Certificat SIG-2025-03-30 · Phase 0 Validée
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#38bdf8] text-[#004965] font-['Geist'] text-xs font-bold hover:bg-[#8ed5ff] transition-colors"
          >
            Fermer la spécification
          </button>
        </div>
      </div>
    </div>
  );
};
