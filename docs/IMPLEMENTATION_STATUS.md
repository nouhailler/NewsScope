# Statut d'Implémentation & Matrice de Conformité — NewsScope Wire

**Date de révision :** 28 octobre 2026  
**Version applicative :** 1.4.2  
**Statut global :** Partiellement prêt pour la production (Connecteur réel GDELT actif avec rate-limit 429 documenté et géré, PWA validée, Tests 100% passants, stockage unifié IndexedDB).

---

## 1. Matrice des Fonctionnalités

| Composant / Fonctionnalité | Statut | Fichier(s) Source | Preuve / Validation |
| :--- | :--- | :--- | :--- |
| **Connecteur Réel GDELT DOC 2.0** | **Implémenté et testé** | `src/services/gdeltService.ts` (`fetchLiveGdeltDispatches`) | Connecté dans `src/App.tsx`. Gère 429 (5s cooldown) et timeout 8.5s. Couvert par `tests/filters.test.ts`. |
| **Normalisation des Dépêches** | **Implémenté et testé** | `src/services/gdeltNormalizer.ts` (`normalizeGdeltArticle`) | 9 tests unitaires passants dans `tests/gdeltNormalizer.test.ts` (dates, canon, syndications, hash). |
| **Détection Mention Tierce / Syndication** | **Implémenté et testé** | `src/services/gdeltNormalizer.ts` (`resolveAgencyAndCanon`) | Testé avec domaines tiers (`daily-finances.fr`). Avertit sans prétendre à une publication directe. |
| **Nettoyeur de Traceurs d'URL** | **Implémenté et testé** | `src/utils/storage.ts` (`sanitizeUrl`) | Supprime `utm_*`, `fbclid`, `cmpid`, `taid`. Testé dans `tests/storage.test.ts`. |
| **Persistance IndexedDB** | **Implémenté et testé** | `src/utils/indexedDB.ts`, `src/utils/storage.ts` | Base `NewsScope_v1`, objectStores `dispatches` et `favorites`. Liste initiale vide `[]`. |
| **PWA Manifest & Service Worker** | **Implémenté et validé** | `public/manifest.webmanifest`, `public/sw.js`, `src/main.tsx` | Enregistrement SW dans `main.tsx`, liens manifest & apple-touch-icon dans `index.html`. |
| **Bouton Installation PWA** | **Implémenté et testé** | `src/components/PWAInstallButton.tsx`, `src/hooks/usePWAInstall.ts` | Gère `beforeinstallprompt`, détection standalone et instructions iOS. |
| **Bascule Direct / Démonstration** | **Implémenté et testé** | `src/App.tsx`, `src/components/Header.tsx`, `src/components/FluxDirectView.tsx` | Toggle explicite dans le Header et le bandeau. Données démo explicitement marquées `[DÉMO]`. |
| **Filtres Avancés & Mots-clés** | **Implémenté et testé** | `src/components/FiltresView.tsx`, `src/services/gdeltService.ts` | Filtre agences, mot-clé, plage temporelle, tri DateDesc/ToneDesc. 4 tests passants. |
| **Indicateur de Date, Heure & Fraîcheur** | **Implémenté et testé** | `src/utils/dateUtils.ts`, `src/components/FreshnessBanner.tsx` | Calcule le jour précis, l'heure UTC exacte, l'âge relatif et un badge couleur de fraîcheur (<1h, <6h, Aujourd'hui, Hier, Archive, Démo). Couvert par 4 tests dans `tests/dateUtils.test.ts`. |
| **Export JSON & Audit Markdown** | **Implémenté et validé** | `src/utils/storage.ts` (`exportFavoritesAsJson`, `exportAuditReportMarkdown`) | Exports conformes RFC 8259 sans métadonnées de tracking. |
| **Flux Direct AFP Canonique B2B** | **Bloqué / Non applicable** | `docs/FEASIBILITY_REPORT.md` | L'accès fil d'agence brut complet AFP requiert une licence commerciale `afpforum.com`. GDELT ne référence que le domaine public `afp.com` ou des mentions tierces. |
| **Intégration Bloomberg Enterprise / Reuters W-Feed** | **Bloqué / Non applicable** | `docs/FEASIBILITY_REPORT.md` | Requiert un terminal Bloomberg B-PIPE ou Reuters Elektron sous licence propriétaire. L'app utilise uniquement les métadonnées publiques autorisées. |

---

## 2. Synthèse des Contrôles d'Audit

| Affirmation Initiale Auditée | Statut Après Correction | Mesure Prise |
| :--- | :--- | :--- |
| *« WIRE: 18ms » figé en en-tête* | **Corrigé** | Remplacé par la mesure réelle de latence GDELT (`liveState.lastResponseTimeMs`) ou `DÉMO: 0ms` / `OFF-GRID`. |
| *« 88% ACHEVÉ » et fausse barre de synchronisation* | **Corrigé** | Supprimé de `FluxDirectView.tsx`. Remplacé par le statut réel du connecteur et le compte réel des dépêches reçues. |
| *« Cryptage local SHA-256 » dans les favoris* | **Corrigé** | Remplacé par l'explication transparente : *Stockage local souverain IndexedDB (partition navigateur non chiffrée)*. |
| *Connecteur GDELT déconnecté de l'UI (`setTimeout` stubs)* | **Corrigé** | `src/App.tsx` appelle `fetchLiveGdeltDispatches` lors du rafraîchissement et au montage en mode direct. |
| *Favoris pré-remplis avec 14 faux éléments pour un nouvel utilisateur* | **Corrigé** | `getStoredFavorites()` renvoie `[]` par défaut. Le cache démarre vide. |
| *Service Worker non enregistré* | **Corrigé** | `src/main.tsx` enregistre `/sw.js` avec gestion d'environnement iframe. |

---

## 3. Résultats des Commandes de Validation Réelle

- **Vérification TypeScript & Lint (`npm run lint` / `tsc --noEmit`) :**  
  *Succès (0 erreur).*
- **Suite de Tests Automatisés (`npm test` / `tsx --test tests/**/*.test.ts`) :**  
  *23/23 tests passés (4 suites : fraîcheur et dates, normalisation GDELT, assainissement stockage, constructeur de requêtes et filtres).*
- **Compilation Production (`npm run build`) :**  
  *Succès du build Vite.*
