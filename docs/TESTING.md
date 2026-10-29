# Guide de Validation & Tests Automatisés

## 1. Stratégie de Test & Intégrité des Données

La suite de tests automatisés de NewsScope Wire garantit l'intégrité bout-en-bout de la chaîne de traitement sans aucune fabrication de données. Elle comprend **45 tests unitaires et d'intégration répartis sur 6 suites** exécutées nativement par Node.js :

- **1. Gestion des dates & fraîcheur (`tests/dateUtils.test.ts` — 6 tests) :**
  - Calcul déterministe des tranches de fraîcheur (< 1 heure, < 6 heures, Aujourd'hui, Hier, Archive).
  - Étiquetage transparent et badge d'avertissement pour les données fictives (`isMock: true`).
  - Gestion explicite des dates absentes sans repli vers `Date.now()`.
  - Gestion explicite des chaînes de date invalides avec drapeau `hasInvalidDate: true`.

- **2. Construction de requêtes & filtres (`tests/filters.test.ts` — 4 tests) :**
  - Construction d'URL GDELT DOC 2.0 multi-agences avec proxy `/api/gdelt`.
  - Exclusion sélective des agences désactivées par l'utilisateur.
  - Injection des contraintes textuelles et opérateurs booléens.
  - Bascule du mode de tri (`DateDesc` pour chronologique vs `ToneDesc` pour pertinence).

- **3. Normalisation, Provenance & SHA-256 (`tests/gdeltNormalizer.test.ts` — 13 tests) :**
  - Extraction stricte du nom d'hôte (`extractHostname`) nettoyant protocoles, ports et préfixes `www.`.
  - Validation des domaines légitimes et sous-domaines officiels (`isLegitimateAgencyDomain`).
  - Tests négatifs de sécurité contre les attaques par spoofing (`reuters.com.example.org`, `fake-bloomberg.com`, `notreuters.com`, `afp.com.malicious.net`).
  - Validation stricte des protocoles HTTP / HTTPS (`isValidHttpUrl`).
  - Attribution canonique des agences officielles (Reuters, Bloomberg, AFP).
  - Attribution transparente des domaines inconnus à `agency: 'other'` (sans défaut erroné vers AFP).
  - Parsing des dates GDELT 14 caractères (`YYYYMMDDHHMMSS`).
  - Détection et signalement des dates invalides.
  - Hachage cryptographique FIPS 180-4 SHA-256 authentique testé sur :
    - Vecteur standard chaîne vide `""`
    - Vecteur standard `"abc"`
    - Titre français accentué UTF-8 (`BCE : Christine Lagarde confirme l'accélération...`)
    - Chaîne Unicode complexe avec idéogrammes et emojis
  - Rejet des articles dépourvus d'URL HTTP valide.
  - Conservation du domaine réel (`sourceDomain`) et distinction stricte de l'empreinte cryptographique (`sha256`) et de l'identifiant applicatif (`id`).

- **4. Connecteur temps réel GDELT (`tests/gdeltService.test.ts` — 7 tests) :**
  - Ingestion d'une réponse HTTP 200 avec tableau d'articles.
  - Traitement transparent de la limitation de débit HTTP 429 avec alerte et temps d'attente.
  - Traitement sans plantage des réponses non-JSON ou corrompues.
  - Traitement des réponses retournant un tableau d'articles vide.
  - Traitement immédiat des dépassements de délai réseau (`AbortError` / timeout 8,5s).
  - Verrou anti-concurrence empêchant les requêtes simultanées en vol (`isRequestInProgress`).
  - Repli direct et diagnostic lorsque le proxy de développement renvoie HTTP 404.

- **5. Séparation des modes & Isolation du détail (`tests/modeSeparation.test.ts` — 7 tests) :**
  - Flux direct vide : renvoie une liste strictement vide sans repli silencieux vers le mock.
  - Cache hors-ligne vide : renvoie une liste strictement vide sans repli silencieux vers le mock.
  - Mode démo : renvoie strictement les données synthétiques avec drapeau `isMock: true`.
  - Vue détail sur flux vide : résout vers `null` et non vers le premier article de démo.
  - Vue détail sur cache vide : résout vers `null` et affiche l'état vide explicite.
  - Pool des favoris : n'inclut aucune dépêche fictive en mode direct ou hors-ligne.
  - Transitions entre modes : bascule étanche des flux sans contamination croisée.

- **6. Assainissement d'URL & Stockage (`tests/storage.test.ts` — 8 tests) :**
  - Décapage des paramètres d'attribution publicitaire (`utm_*`, `fbclid`, `gclid`, `cmpid`, `taid`).
  - Préservation des paramètres utiles de recherche (`q`, `id`, `page`).
  - Tolérance aux URL malformées ou partielles sans exception non gérée.
  - Calcul et formatage de la taille allouée dans le stockage local.
  - Initialisation de la liste des favoris avec un tableau strictement vide (`[]`).
  - Déduplication d'articles identiques portant des jetons de tracking différents.
  - Intégrité de l'ajout, retrait et persistance des favoris.

---

## 2. Exécution des Tests

```bash
# Lancement de la suite complète avec tsx et le test runner natif Node.js
npm test
```

Résultats réels exécutés :
```text
1..6
# tests 45
# suites 6
# pass 45
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

---

## 3. Test de Faisabilité Réseau Direct

Le script `scripts/feasibility-check.mjs` permet d'auditer en direct la connectivité vers l'API GDELT :

```bash
node scripts/feasibility-check.mjs
```

Le rapport d'exécution est écrit dans `reports/feasibility-latest.json` et analysé dans `docs/FEASIBILITY_REPORT.md`.
