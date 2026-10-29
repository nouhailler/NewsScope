# Guide de Déploiement & Configuration de Production

## 1. Vue d'Ensemble des Options de Déploiement

L'application **NewsScope Wire** peut être déployée selon deux architectures distinctes :

1. **Architecture Full-Stack Recommandée (Node.js / Cloud Run / VPS) :**
   - Serveur Express fourni dans `server.ts`.
   - Fournit à la fois la distribution des fichiers statiques compilés (`dist/`) et le point de terminaison proxy `/api/gdelt`.
   - Avantages : Injection transparente des en-têtes CORS, mise en cache mémoire intermédiaire (TTL 60s) pour atténuer la règle de rate-limiting GDELT, protection contre les timeouts.

2. **Architecture Edge / Serverless (Cloudflare Pages + Workers, Vercel, Netlify) :**
   - Les fichiers statiques de l'application sont servis par le CDN.
   - Une fonction Edge ou Serverless intercepte les requêtes vers `/api/gdelt` pour relayer vers `api.gdeltproject.org`.

3. **Hébergement Statique Pur (sans proxy) :**
   - Si aucun proxy n'est déployé, le client tente d'appeler directement `https://api.gdeltproject.org/api/v2/doc/doc`.
   - **Limite technique démontrée :** L'API publique GDELT n'envoie pas les en-têtes `Access-Control-Allow-Origin: *` nécessaires à tous les contextes de navigateurs. En cas d'échec, le client affiche un message d'erreur explicite :  
     *« Erreur CORS navigateur / Proxy requis : GDELT n’autorise pas les appels directs cross-origin. Un proxy /api/gdelt (serveur ou Edge) est nécessaire. »*
   - L'utilisateur est invité à utiliser les favoris en cache ou à basculer vers le mode démo.

---

## 2. Déploiement Full-Stack avec le Serveur Inclus (`server.ts`)

Le dépôt intègre un serveur de production autonome `server.ts` basé sur Express.

### A. Construction et Démarrage

```bash
# 1. Installation reproductible des dépendances
npm ci

# 2. Validation des types et exécution de la suite de tests
npm run lint
npm test

# 3. Compilation du bundle client statique (génère dist/)
npm run build

# 4. Lancement du serveur de production sur le port 3000
npm start
```

### B. Fonctionnalités du Proxy `server.ts`

- **En-têtes CORS :** `Access-Control-Allow-Origin: *` injecté sur toutes les réponses.
- **Cache Serveur en Mémoire :** Les réponses GDELT sont conservées pendant 60 secondes (`CACHE_TTL_MS = 60000`). Deux requêtes identiques successives ne génèrent pas d'appel réseau superflu vers GDELT, évitant ainsi le code HTTP 429.
- **En-têtes de Cache HTTP :** `Cache-Control: public, max-age=60, s-maxage=300`.
- **Protection Timeout :** `AbortController` calibré à 10 secondes.

---

## 3. Configuration Edge Alternative (Cloudflare Worker)

Si vous hébergez le frontend sur **Cloudflare Pages**, ajoutez le fichier `functions/api/gdelt.ts` suivant :

```typescript
export async function onRequestGet(context: any) {
  const url = new URL(context.request.url);
  const target = `https://api.gdeltproject.org/api/v2/doc/doc${url.search}`;

  const response = await fetch(target, {
    headers: {
      'User-Agent': 'NewsScope-Cloudflare-Worker/1.4',
      Accept: 'application/json, text/plain, */*',
    },
    cf: {
      cacheTtl: 60,
      cacheEverything: true,
    },
  });

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Cache-Control', 'public, max-age=60, s-maxage=300');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
```

---

## 4. Configuration Développement Local (Vite)

En développement local (`npm run dev`), Vite relaie automatiquement `/api/gdelt` via la configuration `vite.config.ts` :

```typescript
server: {
  port: 3000,
  host: '0.0.0.0',
  proxy: {
    '/api/gdelt': {
      target: 'https://api.gdeltproject.org/api/v2/doc/doc',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/gdelt/, ''),
    },
  },
}
```

> **Attention d'ingénierie :** Le proxy Vite ci-dessus est **uniquement disponible lors du développement local** (`vite dev`). Il ne doit jamais être confondu avec une infrastructure de production.

---

## 5. Matrice des Erreurs Réseau Gérées Côté Client

Le service client `src/services/gdeltService.ts` catégorise et affiche distinctement chaque anomalie :

| Catégorie | Code / Détection | Comportement Client |
| :--- | :--- | :--- |
| **`RATE_LIMIT`** | HTTP 429 ou cooldown local (< 5s) | Bloque la requête, affiche le décompte des secondes et la directive officielle GDELT. |
| **`TIMEOUT`** | `AbortError` (> 8,5 secondes) | Interrompt la requête sans blocage de l'interface et affiche une alerte de dépassement de délai. |
| **`CORS`** | `TypeError` / `Failed to fetch` sur appel direct | Affiche un diagnostic expliquant la nécessité du proxy `/api/gdelt` et propose le basculement en mode démo. |
| **`NOT_FOUND`** | HTTP 404 sur `/api/gdelt` | Tente un repli direct vers `https://api.gdeltproject.org` avec avertissement sur les contraintes CORS. |
| **`SERVER_ERROR`**| HTTP 5xx | Affiche le statut d'erreur du serveur distant GDELT sans masquer la panne. |
| **`INVALID_JSON`**| Échec du `JSON.parse` | Signale une réponse malformée ou une page HTML d'erreur retournée par le serveur. |
| **`EMPTY`** | Tableau d'articles vide `[]` | Affiche l'état vide informatif sans injecter de fausses dépêches. |
