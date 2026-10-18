# Rapport de Faisabilité Technique — API GDELT DOC 2.0 & Flux d'Agences

**Date du test :** 18 octobre 2026  
**Outil de test :** `scripts/feasibility-check.mjs` (Node.js v22.23.3)  
**Rapport brut :** `reports/feasibility-latest.json`  
**Auteur :** Équipe d'ingénierie NewsScope  

---

## 1. Synthèse Exécutive

L'audit de faisabilité réalisé directement contre les points de terminaison officiels du **GDELT Global Online News Graph (DOC 2.0)** met en évidence trois contraintes architecturales majeures :

| Domaine Testé | Statut HTTP | Temps de Réponse | Bilan Technique |
| :--- | :--- | :--- | :--- |
| **`afp.com`** | `Timeout` (>12 000 ms) | 12 004 ms | Absence de réponse dans les délais / Volume public direct quasi-nul (B2B payant via `afpforum.com`). |
| **`reuters.com`** | `429 Too Many Requests` | 9 678 ms | Limitation stricte de débit GDELT par IP (1 requête / 5 secondes). |
| **`bloomberg.com`** | `429 Too Many Requests` | 7 988 ms | Limitation stricte de débit GDELT par IP (1 requête / 5 secondes). |

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
- **Mesure d'ingénierie :** NewsScope doit intégrer un gestionnaire de limitation de débit côté client avec file d'attente séquentielle, temporisation minimale de 5 000 ms entre deux appels, et affichage transparent du statut HTTP 429 ("Rate limit atteint, patientez 5 secondes").

### B. Distribution Spécifique de l'Agence France-Presse (AFP)
- L'AFP commercialise ses dépêches complètes via sa plateforme professionnelle payante réservée aux abonnés (`afpforum.com`).
- Le domaine public `afp.com` ne publie qu'un sous-ensemble promotionnel et institutionnel.
- **Conséquence :** Les dépêches AFP trouvées sur le web proviennent pour l'essentiel de partenaires syndiqués tiers. NewsScope doit classifier ces articles comme *"Mention tierce / Rediffusion"* et non comme une publication canonique `afp.com`.

### C. Contraintes CORS Navigateur
- L'API publique `https://api.gdeltproject.org/api/v2/doc/doc` n'envoie pas systématiquement les en-têtes `Access-Control-Allow-Origin: *` tolérant tous les contextes navigateurs.
- Une tentative d'appel direct depuis un navigateur web standard déclenche une erreur `Cross-Origin Request Blocked` ou `ERR_BLOCKED_BY_ORB`.
- **Mesure d'ingénierie :** L'architecture doit prévoir soit une route proxy backend / Edge (`functions/api/news.ts` ou route Express `/api/gdelt`), soit une gestion d'erreur transparente indiquant le blocage CORS et proposant le basculement vers le mode de démonstration hors-ligne.

---

## 3. Plan d'Action d'Implémentation Réelle

1. **Étiquetage transparent des données :**
   - Toutes les données statiques contenues dans `src/data/mockDispatches.ts` sont explicitement balisées `isMock: true` et identifiées dans l'interface par un badge bien visible `[DONNÉES FICTIVES / DÉMO]`.
2. **Service GDELT normalisé (`src/services/gdeltService.ts`) :**
   - Implémentation d'un connecteur réel avec `AbortController` (timeout 8 secondes).
   - Cooldown de 5 secondes pour respecter le quota GDELT.
   - Gestion des codes HTTP : `200 OK`, `429 Too Many Requests`, `Timeout` et erreurs réseau.
3. **Suppression des métriques factices :**
   - Élimination des compteurs de latence figés ("WIRE: 18ms") et des fausses barres de synchronisation ("88% achevé").
   - Affichage de la latence réelle mesurée lors des requêtes effectives.
4. **Persistance réelle IndexedDB :**
   - Initialisation avec une liste de favoris vide (`[]`) pour les nouveaux utilisateurs.
   - Utilisation de l'API standard `indexedDB` pour stocker les dépêches mises en favoris par l'utilisateur.
