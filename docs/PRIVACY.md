# Charte de Confidentialité & Protection des Données

## 1. Principes Fondamentaux

NewsScope Wire est conçu selon le principe de **confidentialité dès la conception (Privacy by Design)** :
- **Zéro télémétrie externe :** Aucun script Google Analytics, Meta Pixel, Mixpanel ou autre traceur tiers n'est inclus.
- **Zéro cookie publicitaire :** L'application n'utilise ni cookie tiers ni cookie de session persistante.
- **Stockage souverain :** Tous les favoris, notes d'analyse et dépêches mises en cache sont conservés exclusivement sur votre appareil dans la base locale `IndexedDB` (`NewsScope_v1`).

## 2. Assainissement des URL Anti-Tracking

Avant toute indexation ou ouverture d'article, NewsScope applique la fonction `sanitizeUrl` qui élimine l'ensemble des paramètres d'attribution publicitaire :
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- `fbclid` (identifiant de clic Meta)
- `gclid` (identifiant de clic Google Ads)
- `cmpid` (identifiant de campagne média)
- `taid`, `igshid`, `ref`, `source`

## 3. Droit à l'Effacement & Souveraineté des Données

L'utilisateur dispose d'un contrôle total sur ses données locales :
- Bouton **« Vider le cache »** ou **« Purger le stockage local »** dans l'onglet Favoris : supprime immédiatement et irrévocablement l'ensemble des enregistrements de la base IndexedDB.
- Bouton **« Exporter JSON »** : permet de télécharger l'intégralité de ses favoris au format ouvert standard RFC 8259 sans aucune dépendance envers un serveur.
