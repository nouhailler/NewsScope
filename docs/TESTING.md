# Guide de Validation & Tests Automatisés

## 1. Stratégie de Test

La suite de tests automatisés de NewsScope Wire couvre l'intégrité de la chaîne de traitement de données :
- **Tests unitaires de normalisation (`tests/gdeltNormalizer.test.ts`) :**
  - Parsing des dates UTC GDELT au format `YYYYMMDDTHHMMSSZ`.
  - Formatage relatif du temps en français (minutes, heures, jours).
  - Détection canonique des domaines d'agences (`reuters.com`, `bloomberg.com`, `afp.com`).
  - Détection et alerte des syndications tierces.
  - Calcul déterministe des empreintes de hachage.
  - Conversion complète d'un payload brut en objet `Dispatch`.
- **Tests d'assainissement d'URL et stockage (`tests/storage.test.ts`) :**
  - Nettoyage des paramètres d'attribution (`utm_*`, `fbclid`, `gclid`, `cmpid`, `taid`).
  - Préservation des paramètres utiles de recherche (`q`, `page`).
  - Tolérance aux URL malformées.
  - Estimation de la taille de stockage IndexedDB.
  - Initialisation de la liste des favoris avec un tableau strictement vide (`[]`).
- **Tests de construction de requêtes & filtres (`tests/filters.test.ts`) :**
  - Construction d'URL GDELT DOC 2.0 multi-agences.
  - Exclusion sélective des agences désactivées par l'utilisateur.
  - Injection des contraintes textuelles par mot-clé.
  - Bascule du mode de tri (`DateDesc` vs `ToneDesc`).

## 2. Exécution des Tests

```bash
# Lancement de tous les tests avec tsx et le test runner natif de Node.js
npm test
```

Résultats attendus :
```text
1..3
# tests 19
# suites 3
# pass 19
# fail 0
```

## 3. Test de Faisabilité Réseau Direct

Le script `scripts/feasibility-check.mjs` permet d'auditer en direct la connectivité vers l'API GDELT :

```bash
node scripts/feasibility-check.mjs
```

Le rapport d'exécution est écrit dans `reports/feasibility-latest.json` et analysé dans `docs/FEASIBILITY_REPORT.md`.
