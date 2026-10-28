# Architecture Système — NewsScope Wire

## 1. Vue d'Ensemble

NewsScope Wire est un téléscripteur d'information internationale et financière conçu pour fonctionner de manière souveraine, décentralisée et résiliente aux pannes réseau.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          NAVIGATEUR UTILISATEUR                        │
│                                                                        │
│   ┌─────────────────────┐               ┌──────────────────────────┐   │
│   │   Composants React  │ ◄───────────► │    Hooks & Contrôleurs   │   │
│   │ (Flux, Favoris, UI) │               │ (usePWAInstall, App.tsx) │   │
│   └──────────┬──────────┘               └────────────┬─────────────┘   │
│              │                                       │                 │
│              ▼                                       ▼                 │
│   ┌─────────────────────┐               ┌──────────────────────────┐   │
│   │ Base IndexedDB      │               │ Moteur GDELT             │   │
│   │ (NewsScope_v1)      │               │ (gdeltService.ts)        │   │
│   │ • dispatches store  │               │ • Rate-limit 5s          │   │
│   │ • favorites store   │               │ • Timeout 8.5s           │   │
│   └─────────────────────┘               └────────────┬─────────────┘   │
│                                                      │                 │
└──────────────────────────────────────────────────────┼─────────────────┘
                                                       │
                                      GET /api/gdelt (dev proxy)
                                      ou https://api.gdeltproject.org (direct)
                                                       │
                                                       ▼
                                          ┌────────────────────────┐
                                          │   GDELT Global Online  │
                                          │     News Graph 2.0     │
                                          │  (Reuters, Bloomberg,  │
                                          │       AFP Mentions)    │
                                          └────────────────────────┘
```

## 2. Ingestion & Réseau

1. **Proxy de Développement Vite :**  
   Pour contourner les restrictions CORS des navigateurs modernes, `vite.config.ts` configure un proxy `/api/gdelt` redirigeant vers `https://api.gdeltproject.org/api/v2/doc/doc`.
2. **Gestion de Rate-Limiting :**  
   GDELT DOC 2.0 impose 1 requête par tranche de 5 secondes par IP. `gdeltService.ts` calcule le delta temporel (`timeSinceLast < 5000ms`) et bloque préventivement les requêtes concurrentes avec renvoi d'un statut HTTP 429 explicite et temps d'attente restant.
3. **Timeout Réseau :**  
   Chaque requête vers GDELT est chapeautée par un `AbortController` calibré à 8 500 ms afin d'éviter le blocage de l'interface en cas de lenteur du nœud GDELT.

## 3. Stockage Souverain (IndexedDB)

- **Nom de la base :** `NewsScope_v1` (Version 1).
- **Stores :**
  - `dispatches` (clé : `id`) : Cache des dépêches ingérées ou consultées.
  - `favorites` (clé : `id`) : Identifiants épinglés par l'utilisateur avec horodatage d'archivage.
- **Principe de souveraineté :** Aucune base distante, aucun serveur d'authentification tiers. Les données de l'utilisateur ne quittent jamais la machine locale.

## 4. Normalisation & Hygiène des Données

Le module `gdeltNormalizer.ts` assure :
- Le décapage des traceurs publicitaires (`utm_*`, `fbclid`, `gclid`, `cmpid`, `taid`).
- La vérification de conformité canonique de domaine.
- L'étiquetage des rediffusions tierces pour l'AFP et autres sources d'agences syndiquées.
- La génération d'une empreinte déterministe par article.
