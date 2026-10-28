# Rapport de Faisabilité Technique — API GDELT DOC 2.0 & Flux d'Agences

**Date du test :** 28 octobre 2026 (11:12:36 UTC)  
**Outil de test :** `scripts/feasibility-check.mjs` (Node.js v22.23.4)  
**Rapport brut :** `reports/feasibility-latest.json`  
**Auteur :** Équipe d'ingénierie NewsScope  

---

## 1. Synthèse Exécutive

L'audit de faisabilité réalisé directement contre les points de terminaison officiels du **GDELT Global Online News Graph (DOC 2.0)** met en évidence trois contraintes architecturales majeures :

| Domaine Testé | Statut HTTP | Temps de Réponse | Bilan Technique |
| :--- | :--- | :--- | :--- |
| **`afp.com`** | `429 Too Many Requests` | 11 200 ms | Limitation stricte de débit GDELT par IP (1 requête / 5 secondes). Absence de flux d'agence brut public (réservé B2B via `afpforum.com`). |
| **`reuters.com`** | `429 Too Many Requests` | 9 683 ms | Limitation stricte de débit GDELT par IP partagée en datacenter/cloud. |
| **`bloomberg.com`** | `429 Too Many Requests` | 9 708 ms | Limitation stricte de débit GDELT par IP partagée en datacenter/cloud. |

> **Règle d'intégrité :** Aucun résultat n'a été fabriqué ou masqué. L'application ne doit en aucun cas présenter des données de démonstration comme des données récupérées en direct ou prétendre à une latence arbitraire ("18ms WIRE").

---

## 2. Analyse Détaillée des Contraintes Découvertes

### A. Politique de Débit Stricte de GDELT (HTTP 429)
Le serveur public GDELT renvoie explicitement le message suivant en cas de requêtes rapprochées ou d'adresses IP mutualisées (notamment en environnement Cloud / Datacenter) :
```text
HTTP/1.1 429 Too Many Requests
Please limit requests to one every 5 seconds or contact kalev.leetaru5@gmail.com for larger queries.
All high-traffic users should switch to our ngrams dataset: https://blog.gdeltproject.org/using-the-new-web-ngrams-dataset-to-find-relevant-coverage/
```
- **Conséquence directe :** Un client web ne peut pas rafraîchir en rafale ni paralléliser les requêtes sur plusieurs agences simultanément.
- **Mesure d'ingénierie :** NewsScope intègre un gestionnaire de limitation de débit côté client avec verrou anti-concurrence (`isRequestInProgress`), temporisation minimale de 5 000 ms (`MIN_COOLDOWN_MS`) entre deux appels, et affichage transparent du statut HTTP 429 avec décompte des secondes restantes avant nouvel essai.

### B. Distribution Spécifique de l'Agence France-Presse (AFP)
- L'AFP commercialise ses dépêches complètes via sa plateforme professionnelle payante réservée aux abonnés (`afpforum.com`).
- Le domaine public `afp.com` ne publie qu'un sous-ensemble promotionnel et institutionnel.
- **Conséquence :** Les dépêches AFP trouvées sur le web proviennent pour l'essentiel de partenaires syndiqués tiers. NewsScope classifie strictement ces articles comme *"Mention tierce / Rediffusion"* (`isThirdPartyMention: true`) et non comme une publication canonique `afp.com`.

### C. Contraintes CORS Navigateur & Hébergement Production
- L'API publique `https://api.gdeltproject.org/api/v2/doc/doc` n'envoie pas systématiquement les en-têtes `Access-Control-Allow-Origin: *` tolérant tous les contextes navigateurs.
- Une tentative d'appel direct depuis un navigateur web standard déclenche une erreur `Cross-Origin Request Blocked` ou `ERR_BLOCKED_BY_ORB`.
- **En développement :** Le serveur Vite intègre un proxy local `/api/gdelt` (`changeOrigin: true`).
- **En production :** Un proxy statique Vite n'existe pas en production. L'application nécessite soit une fonction Edge / Worker (ex: Cloudflare Workers, Cloud Run, Vercel Serverless) pour `/api/gdelt`, soit le basculement explicite en mode hors-ligne ou démo si l'API est inaccessible. Le connecteur détecte l'échec du proxy (HTTP 404) et tente l'URL directe tout en fournissant un diagnostic CORS clair à l'utilisateur.

---

## 3. Plan d'Action d'Implémentation Réelle

1. **Étiquetage transparent des données :**
   - Toutes les données statiques contenues dans `src/data/mockDispatches.ts` sont explicitement balisées `isMock: true` et identifiées dans l'interface par un badge permanent `[DONNÉES FICTIVES / DÉMO]`.
2. **Service GDELT normalisé (`src/services/gdeltService.ts`) :**
   - Implémentation d'un connecteur réel avec `AbortController` (timeout 8.5 secondes).
   - Verrou anti-concurrence et cooldown de 5 secondes pour respecter le quota GDELT.
   - Gestion des codes HTTP : `200 OK`, `429 Too Many Requests`, `Timeout` et erreurs réseau avec diagnostic transparent.
3. **Suppression des métriques factices :**
   - Élimination des compteurs de latence figés ("WIRE: 18ms") et des fausses barres de synchronisation ("88% achevé").
   - Affichage de la latence réelle mesurée lors des requêtes effectives (`liveState.lastResponseTimeMs`).
4. **Persistance réelle IndexedDB :**
   - Initialisation avec une liste de favoris vide (`[]`) pour les nouveaux utilisateurs.
   - Utilisation de l'API standard `indexedDB` (`NewsScope_v1`, stores `dispatches` et `favorites`) pour stocker les dépêches mises en favoris par l'utilisateur et les articles mis en cache.
