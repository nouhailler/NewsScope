# Guide de Déploiement & Configuration

## 1. Prérequis Système

- **Node.js :** Version 20.x ou 22.x LTS recommandée.
- **Gestionnaire de paquets :** `npm` (ou `bun` / `pnpm`).

## 2. Installation Locale

```bash
# Installation reproductible des dépendances
npm ci

# Lancement du serveur de développement Vite
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## 3. Configuration du Proxy GDELT (Développement)

Dans `vite.config.ts`, le proxy inverse suivant est configuré pour relayer les requêtes sans blocage CORS :

```typescript
server: {
  proxy: {
    '/api/gdelt': {
      target: 'https://api.gdeltproject.org/api/v2/doc/doc',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/gdelt/, ''),
    },
  },
}
```

## 4. Build de Production

```bash
# Validation TypeScript
npm run lint

# Exécution des tests unitaires
npm test

# Compilation des bundles statiques
npm run build
```

Les fichiers compilés sont générés dans le dossier `dist/`.

## 5. Déploiement PWA & Production

L'application est une Progressive Web App statique pouvant être hébergée sur n'importe quel CDN ou hébergeur statique (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Firebase Hosting).
En production, il est recommandé de mettre en place une fonction Edge ou Cloud Function (`/api/gdelt`) pour assurer le rôle de proxy avec mise en cache intermédiaire (Cache-Control: s-maxage=300) afin d'atténuer le rate-limit strict de GDELT.
