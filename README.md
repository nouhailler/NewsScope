# NewsScope Wire — Terminal de Dépêches Internationales & Géopolitiques

NewsScope Wire est un téléscripteur d'actualité financière et géopolitique en temps réel conçu pour les journalistes, analystes macro-économiques et professionnels de l'information. L'application agrège et normalise les flux d'agences de presse mondiales (Reuters, Bloomberg, AFP) via l'API publique **GDELT Global Online News Graph (DOC 2.0)** avec persistance souveraine **IndexedDB** et résilience hors-ligne **Progressive Web App (PWA)**.

---

## ⚡ Caractéristiques Principales

- **Connecteur Réel GDELT DOC 2.0 :** Interrogation en temps réel des dépêches internationales avec gestion du rate-limit (cooldown de 5 secondes) et protection contre les timeouts réseau.
- **Bascule Direct / Démonstration :** Permet de basculer à tout moment entre l'interrogation en direct de l'API GDELT et un jeu de données synthétique pour tester l'ergonomie hors-réseau.
- **Hygiène & Anti-Tracking :** Décapage automatique de tous les paramètres d'attribution publicitaire (`utm_*`, `fbclid`, `gclid`, `cmpid`).
- **Attribution & Droits Voisins :** Conformité avec la directive européenne 2019/790. Détection des syndications tierces mentionnant l'AFP sans prétendre à une publication directe.
- **Stockage Souverain IndexedDB :** Base locale `NewsScope_v1` (`dispatches` & `favorites`). Zéro cookie, zéro télémétrie tierce, liste de favoris initialement vide (`[]`).
- **PWA & Résilience Hors-Ligne :** Manifeste Web, Service Worker avec stratégie Cache-First pour les assets et Network-First pour l'API, installable sur ordinateur et mobile.
- **Export & Portabilité :** Export complet des favoris en JSON RFC 8259 et rapport d'audit d'architecture en Markdown.

---

## 🚀 Démarrage Rapide

```bash
# Installation reproductible
npm ci

# Lancement du serveur local de développement
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

---

## 🧪 Tests & Qualité

```bash
# Exécution de la suite de tests automatisés (19 tests)
npm test

# Validation des types TypeScript
npm run lint

# Build de production
npm run build
```

---

## 📚 Documentation Détaillée

- [Statut d'Implémentation & Matrice d'Audit (`docs/IMPLEMENTATION_STATUS.md`)](./docs/IMPLEMENTATION_STATUS.md)
- [Rapport de Faisabilité Technique GDELT (`docs/FEASIBILITY_REPORT.md`)](./docs/FEASIBILITY_REPORT.md)
- [Architecture Système (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)
- [Sources d'Information & Cadre Légal (`docs/SOURCES.md`)](./docs/SOURCES.md)
- [Guide de Déploiement (`docs/DEPLOYMENT.md`)](./docs/DEPLOYMENT.md)
- [Guide de Test (`docs/TESTING.md`)](./docs/TESTING.md)
- [Charte de Confidentialité (`docs/PRIVACY.md`)](./docs/PRIVACY.md)

---

## 📄 Licence

Apache-2.0
