# NewsScope Wire — Terminal de Dépêches Internationales & Géopolitiques

NewsScope Wire est un téléscripteur d'actualité financière et géopolitique en temps réel conçu pour les journalistes, analystes macro-économiques et professionnels de l'information. L'application agrège et normalise les flux d'agences de presse mondiales (Reuters, Bloomberg, AFP) via l'API publique **GDELT Global Online News Graph (DOC 2.0)** avec persistance souveraine **IndexedDB** et résilience hors-ligne **Progressive Web App (PWA)**.

---

## ⚡ Caractéristiques Principales

- **Connecteur Réel GDELT DOC 2.0 :** Interrogation de l'API avec verrou anti-concurrence, temporisation minimale (cooldown 5 secondes), gestion explicite des codes HTTP (200, 429 Too Many Requests, 404 proxy fallback) et protection contre les timeouts (8.5s via `AbortController`).
- **Séparation Stricte des Modes :** 
  - **Flux Direct :** Affiche uniquement les dépêches reçues en direct (aucun repli silencieux vers le mock).
  - **Mode Démonstration :** Affiche uniquement le jeu de données fictif avec bandeau d'avertissement permanent.
  - **Mode Hors-Ligne :** Affiche uniquement les articles réellement archivés dans la base locale `NewsScope_v1`.
- **Hygiène & Anti-Tracking :** Décapage automatique de tous les paramètres d'attribution publicitaire (`utm_*`, `fbclid`, `gclid`, `cmpid`, `taid`).
- **Provenance & Attribution Stricte :** Détection stricte des noms d'hôte (`hostname`), validation contre les domaines spoofés (`reuters.com.example.org`), classement des domaines tiers en `other` (sans défaut erroné vers AFP) et étiquetage systématique des mentions tierces.
- **Stockage Souverain IndexedDB :** Base locale `NewsScope_v1` (`dispatches` & `favorites`). Zéro cookie, zéro télémétrie tierce, initialisation à vide (`[]`).
- **Indicateur de Date, Heure & Fraîcheur :** Horodatage UTC exact, jour de parution et calcul de fraîcheur (<1h, <6h, Aujourd'hui, Hier, Archive, Démo). Gestion transparente des dates absentes ou invalides.
- **PWA & Résilience Hors-Ligne :** Manifeste Web, Service Worker avec stratégie Cache-First pour les assets et Network-First pour l'API, installable sur ordinateur et mobile.
- **Export & Portabilité :** Export complet des favoris en JSON RFC 8259 et rapport d'audit d'architecture en Markdown.

---

## 🚀 Démarrage Rapide

```bash
# Installation reproductible (validée avec lockfile)
npm ci

# Lancement du serveur local de développement
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

---

## 🧪 Tests & Qualité

```bash
# Exécution de la suite complète de 37 tests automatisés (5 suites)
npm test

# Validation stricte des types TypeScript
npm run lint

# Compilation de production Vite
npm run build
```

---

## 📚 Documentation Détaillée

- [Statut d'Implémentation & Matrice d'Audit (`docs/IMPLEMENTATION_STATUS.md`)](./docs/IMPLEMENTATION_STATUS.md)
- [Rapport de Faisabilité Technique GDELT (`docs/FEASIBILITY_REPORT.md`)](./docs/FEASIBILITY_REPORT.md)
- [Architecture Système (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)
- [Sources d'Information & Cadre Légal (`docs/SOURCES.md`)](./docs/SOURCES.md)
- [Guide de Déploiement & Configuration Edge (`docs/DEPLOYMENT.md`)](./docs/DEPLOYMENT.md)
- [Guide de Validation & Tests (`docs/TESTING.md`)](./docs/TESTING.md)
- [Charte de Confidentialité (`docs/PRIVACY.md`)](./docs/PRIVACY.md)

---

## 📄 Licence

Apache-2.0
