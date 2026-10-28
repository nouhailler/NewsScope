/**
 * NewsScope Wire — Serveur Node.js & Proxy de Production
 * 
 * Fournit :
 * 1. La route proxy /api/gdelt vers https://api.gdeltproject.org/api/v2/doc/doc
 *    avec injection des en-têtes CORS, cache intermédiaire (s-maxage=300) et temporisation.
 * 2. La distribution des fichiers statiques de production (dist/) et le fallback SPA.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const GDELT_DOC_API = 'https://api.gdeltproject.org/api/v2/doc/doc';

// Cache mémoire serveur simple pour soulager le rate-limit GDELT
const responseCache = new Map<string, { body: string; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Proxy route pour l'API GDELT DOC 2.0
app.get('/api/gdelt', async (req, res) => {
  const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
  const targetUrl = `${GDELT_DOC_API}?${queryString}`;

  // Vérification du cache mémoire serveur
  const cached = responseCache.get(targetUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('X-Cache-Status', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(cached.body);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NewsScope-Production-Edge-Proxy/1.4',
        Accept: 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeout);

    const bodyText = await upstream.text();

    res.status(upstream.status);
    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (upstream.ok) {
      responseCache.set(targetUrl, { body: bodyText, timestamp: Date.now() });
    }

    return res.send(bodyText);
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Gateway Timeout vers GDELT' : 'Bad Gateway vers GDELT',
      message: err.message,
    });
  }
});

// Distribution des fichiers statiques compilés
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[NewsScope Wire] Serveur de production démarré sur le port ${PORT}`);
    console.log(`[NewsScope Wire] Proxy GDELT opérationnel sur http://localhost:${PORT}/api/gdelt`);
  });
}

export default app;
