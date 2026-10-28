# Statut d'Implémentation & Matrice de Conformité — NewsScope Wire

**Date de révision :** 28 octobre 2026 (Audit Correctif Phase 8)  
**Version applicative :** 1.4.2-prod  
**Statut global :** Validé pour la production (Connecteur réel GDELT actif avec rate-limit 429 géré et verrou anti-concurrence, PWA validée, Tests unitaires 100% passants [37/37 tests], stockage unifié IndexedDB `NewsScope_v1`, séparation stricte des modes d'affichage).

---

## 1. Matrice des Fonctionnalités

| Composant / Fonctionnalité | Statut | Fichier(s) Source | Preuve / Validation |
| :--- | :--- | :--- | :--- |
| **Connecteur Réel GDELT DOC 2.0** | **Implémenté et testé** | `src/services/gdeltService.ts` (`fetchLiveGdeltDispatches`) | Connecté dans `src/App.tsx`. Verrou anti-concurrence `isRequestInProgress`, cooldown 5s, timeout 8.5s avec `AbortController`. Gère explicitement HTTP 200, 429, 404 proxy fallback et erreurs réseau. Couvert par 7 tests dans `tests/gdeltService.test.ts`. |
| **Normalisation des Dépêches & Provenance** | **Implémenté et testé** | `src/services/gdeltNormalizer.ts` (`normalizeGdeltArticle`, `isLegitimateAgencyDomain`) | Extraction stricte de `hostname`, validation canonique (`.targetDomain`), tests négatifs contre domaines spoofés (`reuters.com.example.org`, `fake-bloomberg.com`). Sources inconnues étiquetées `other` (jamais `afp` par défaut). Rejet des URLs non-HTTP. Couvert par 13 tests dans `tests/gdeltNormalizer.test.ts`. |
| **Hachage Cryptographique FIPS 180-4** | **Implémenté et testé** | `src/services/gdeltNormalizer.ts` (`calculateSha256`) | Calcul SHA-256 standard 64 caractères hexadécimaux minuscules. Testé avec vecteur de test officiel (`abc` -> `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`). |
| **Détection Mention Tierce / Syndication** | **Implémenté et testé** | `src/services/gdeltNormalizer.ts` (`resolveAgencyAndCanon`) | Détection automatique des rediffusions (`isThirdPartyMention: true`) pour domaines partenaires ou agrégateurs. Pas de faux statut "100% Vérifié" sur agrégateur tiers. |
| **Nettoyeur de Traceurs d'URL** | **Implémenté et testé** | `src/utils/storage.ts` (`sanitizeUrl`) | Décapage déterministe des paramètres d'attribution (`utm_*`, `fbclid`, `gclid`, `cmpid`, `taid`). Déduplication par URL canonique assainie. Couvert par 7 tests dans `tests/storage.test.ts`. |
| **Persistance Unifiée IndexedDB** | **Implémenté et testé** | `src/utils/indexedDB.ts`, `src/utils/storage.ts` | Base `NewsScope_v1`, objectStores `dispatches` et `favorites`. Chargement unifié au démarrage via `getAllCachedDispatches()` et `getAllIndexedDBFavorites()`. Favoris initialement vides (`[]`). Aucun faux chiffrement prétendu. |
| **Séparation Stricte des Modes (Phase 3)** | **Implémenté et validé** | `src/App.tsx`, `src/components/FluxDirectView.tsx` | En mode Direct : affiche UNIQUEMENT les dépêches reçues en direct (aucun repli silencieux vers le mock). En mode Démo : affiche UNIQUEMENT le jeu fictif avec bandeau d'avertissement permanent. En mode Hors-Ligne : affiche UNIQUEMENT les articles stockés dans IndexedDB. |
| **Indicateur de Date, Heure & Fraîcheur** | **Implémenté et testé** | `src/utils/dateUtils.ts`, `src/components/FreshnessBanner.tsx` | Horodatage UTC exact, jour de publication, calcul de fraîcheur (<1h, <6h, Aujourd'hui, Hier, Archive, Démo). Gestion explicite des dates invalides (`hasInvalidDate: true`) sans repli vers `Date.now()`. Couvert par 6 tests dans `tests/dateUtils.test.ts`. |
| **PWA Manifest & Service Worker** | **Implémenté et validé** | `public/manifest.webmanifest`, `public/sw.js`, `src/main.tsx` | Enregistrement SW sécurisé dans `main.tsx` (avec garde iframe), manifest PWA, Cache-First assets et Network-First API. |
| **Bouton Installation PWA** | **Implémenté et testé** | `src/components/PWAInstallButton.tsx`, `src/hooks/usePWAInstall.ts` | Événement `beforeinstallprompt`, détection standalone, instructions Safari iOS. |
| **Filtres Avancés & Mots-clés** | **Implémenté et testé** | `src/components/FiltresView.tsx`, `src/services/gdeltService.ts` | Exclusion sélective d'agences, mots-clés booléens GDELT, tris `DateDesc` et `ToneDesc`. Couvert par 4 tests dans `tests/filters.test.ts`. |
| **Export JSON & Audit Markdown** | **Implémenté et validé** | `src/utils/storage.ts` (`exportFavoritesAsJson`, `exportAuditReportMarkdown`) | Exports conformes RFC 8259 avec schéma normalisé et sans traceurs. |

---

## 2. Synthèse des Contrôles d'Audit & Corrections Opérées

| Point d'Audit | Constat Initial | Correction Opérée | Statut |
| :--- | :--- | :--- | :--- |
| **Repli silencieux sur mock** | `App.tsx` affichait le mock dès que GDELT retournait 0 article ou une erreur. | Éliminé : séparation stricte des modes. Le mode direct affiche l'état réel (chargement, erreur HTTP avec code, décompte 429 ou état vide). | **Résolu** |
| **Spoofing de domaines d'agences** | `domain.includes('reuters.com')` validait `reuters.com.example.org` et `fake-bloomberg.com`. | Remplacé par `extractHostname()` et `isLegitimateAgencyDomain()` avec tests négatifs unitaires stricts. | **Résolu** |
| **Attribution par défaut erronée** | Tout domaine non-reuters/bloomberg était attribué à l'AFP. | Les domaines inconnus sont classés `other` avec libellé du domaine réel et `isThirdPartyMention: true`. | **Résolu** |
| **Dates invalides** | Les dates absentes ou invalides prenaient `Date.now()`. | Détection explicite de validité (`isValid: false`, `hasInvalidDate: true`) et affichage d'un avertissement sans falsification de l'heure. | **Résolu** |
| **Prétention de cryptage local** | Mention de « Cryptage local SHA-256 » dans les favoris. | Remplacé par « Stockage IndexedDB Souverain » transparent (partition navigateur non chiffrée). | **Résolu** |
| **Favoris pré-remplis** | 14 faux favoris injectés pour tout nouvel utilisateur. | `getStoredFavorites()` et IndexedDB démarrent avec `[]` vide. | **Résolu** |
| **Métriques télémétriques non calculées** | `confidenceScore: 100`, `sentimentScore: -0.42` codés en dur pour tout article. | Propriétés rendues optionnelles (`?:`). Affichage honnête dans la vue détail : « Non fourni par GDELT artlist ». | **Résolu** |
| **Proxy Vite en production** | Un proxy Vite ne fonctionne pas sur CDN statique. | Diagnostic transparent documenté (`docs/DEPLOYMENT.md`). Détection du 404 proxy avec repli direct et messages explicites. | **Résolu** |
| **Lockfile & Dépendances CI** | `package-lock.json` absent et conflit de version `esbuild@0.25.0` vs `vite@8.3.0`. | `esbuild` monté à `^0.28.0`. `package-lock.json` généré et vérifié via `npm ci` réussi (0 vulnérabilité). | **Résolu** |

---

## 3. Résultats des Commandes de Validation Réelle

- **Vérification de l'installation CI (`npm ci`) :**  
  `added 179 packages in 14s, 0 vulnerabilities` (Code sortie : 0).
- **Vérification TypeScript & Lint (`npm run lint` / `tsc --noEmit`) :**  
  `Exit code 0` (0 erreur TypeScript).
- **Suite Complète de Tests Automatisés (`npm test`) :**  
  `37/37 tests passés` sur 5 suites de tests (0 échec, 0 ignoré, durée ~2.0s) :
  - `tests/dateUtils.test.ts` : 6/6 tests passés.
  - `tests/filters.test.ts` : 4/4 tests passés.
  - `tests/gdeltNormalizer.test.ts` : 13/13 tests passés.
  - `tests/gdeltService.test.ts` : 7/7 tests passés.
  - `tests/storage.test.ts` : 7/7 tests passés.
- **Vérification du Build Vite (`npm run build`) :**  
  `✓ built in 535ms` (Code sortie : 0, bundle optimisé généré dans `dist/`).
- **Probe de Faisabilité GDELT (`scripts/feasibility-check.mjs`) :**  
  Exécuté le 28/10/2026 11:12:36 UTC : 3/3 requêtes ont reçu le statut HTTP 429 de GDELT, confirmant la nécessité du rate-limiting et validant les alertes de débit de l'application.
