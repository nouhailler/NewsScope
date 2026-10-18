/**
 * NewsScope — Script de vérification de faisabilité de l'API GDELT DOC 2.0
 * 
 * Teste indépendamment les endpoints GDELT pour afp.com, reuters.com et bloomberg.com.
 * Mesure: statut HTTP, temps de réponse, articles retournés, dates, domaines, doublons et erreurs.
 * Écrit le rapport dans reports/feasibility-latest.json.
 */

import fs from 'node:fs';
import path from 'node:path';

const GDELT_BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const TARGET_DOMAINS = ['afp.com', 'reuters.com', 'bloomberg.com'];
const DELAY_BETWEEN_REQUESTS_MS = 6000; // Respect de la règle GDELT : max 1 req / 5 secondes

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probeDomain(domain) {
  const url = `${GDELT_BASE_URL}?query=domainis:${encodeURIComponent(domain)}&mode=artlist&maxrecords=10&format=json`;
  const startTime = Date.now();

  const probe = {
    domain,
    query_url: url,
    timestamp: new Date().toISOString(),
    http_status: null,
    status_text: null,
    response_time_ms: null,
    success: false,
    error: null,
    rate_limited: false,
    content_type: null,
    total_articles: 0,
    duplicate_count: 0,
    unique_titles: [],
    sample_articles: [],
    domain_consistency: {
      matched_expected_domain: 0,
      mismatched_domain: 0,
      mismatched_examples: [],
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NewsScope-FeasibilityCheck/1.4 (Node.js/Audit)',
        Accept: 'application/json, text/plain, */*',
      },
    });

    clearTimeout(timeout);
    probe.response_time_ms = Date.now() - startTime;
    probe.http_status = res.status;
    probe.status_text = res.statusText;
    probe.content_type = res.headers.get('content-type') || 'unknown';

    if (res.status === 429) {
      probe.rate_limited = true;
      const bodyText = await res.text();
      probe.error = `HTTP 429 Rate Limit Détecté: ${bodyText.trim()}`;
      return probe;
    }

    if (!res.ok) {
      const bodyText = await res.text();
      probe.error = `HTTP ${res.status}: ${bodyText.slice(0, 300)}`;
      return probe;
    }

    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      probe.error = `Réponse non-JSON reçue: ${rawText.slice(0, 300)}`;
      return probe;
    }

    probe.success = true;
    const articles = Array.isArray(data.articles) ? data.articles : [];
    probe.total_articles = articles.length;

    // Analyse des doublons et des domaines
    const titleSet = new Set();
    const urlSet = new Set();

    for (const art of articles) {
      const title = art.title || '(Sans titre)';
      const artUrl = art.url || '';
      const seendate = art.seendate || '';

      if (urlSet.has(artUrl)) {
        probe.duplicate_count++;
      } else {
        urlSet.add(artUrl);
      }

      titleSet.add(title);

      // Vérification de la consistance de domaine
      let parsedDomain = '';
      try {
        const u = new URL(artUrl);
        parsedDomain = u.hostname.replace(/^www\./, '');
      } catch {
        parsedDomain = 'invalid-url';
      }

      if (parsedDomain.includes(domain.replace(/^www\./, ''))) {
        probe.domain_consistency.matched_expected_domain++;
      } else {
        probe.domain_consistency.mismatched_domain++;
        if (probe.domain_consistency.mismatched_examples.length < 3) {
          probe.domain_consistency.mismatched_examples.push({
            url: artUrl,
            found_domain: parsedDomain,
          });
        }
      }

      if (probe.sample_articles.length < 3) {
        probe.sample_articles.push({
          title,
          url: artUrl,
          seendate,
          domain: parsedDomain,
          language: art.language || 'unknown',
        });
      }
    }

    probe.unique_titles = Array.from(titleSet).slice(0, 5);

    return probe;
  } catch (err) {
    probe.response_time_ms = Date.now() - startTime;
    probe.error = err.name === 'AbortError' ? 'Délai d’attente dépassé (Timeout 12s)' : err.message;
    return probe;
  }
}

async function runFeasibilityCheck() {
  console.log('='.repeat(65));
  console.log('NewsScope — Exécution de la preuve de faisabilité GDELT DOC 2.0');
  console.log(`Date d'exécution : ${new Date().toISOString()}`);
  console.log(`Cibles : ${TARGET_DOMAINS.join(', ')}`);
  console.log('='.repeat(65));

  const results = {
    metadata: {
      generated_at: new Date().toISOString(),
      node_version: process.version,
      api_endpoint: GDELT_BASE_URL,
      cooldown_between_requests_ms: DELAY_BETWEEN_REQUESTS_MS,
    },
    summary: {
      total_tested: TARGET_DOMAINS.length,
      success_count: 0,
      rate_limited_count: 0,
      error_count: 0,
    },
    probes: {},
  };

  for (let i = 0; i < TARGET_DOMAINS.length; i++) {
    const domain = TARGET_DOMAINS[i];
    console.log(`\n[${i + 1}/${TARGET_DOMAINS.length}] Test du domaine : ${domain}...`);

    const probe = await probeDomain(domain);
    results.probes[domain] = probe;

    if (probe.success) {
      results.summary.success_count++;
      console.log(`  ✓ Statut : ${probe.http_status} OK (${probe.response_time_ms} ms)`);
      console.log(`  ✓ Dépêches retournées : ${probe.total_articles} (Doublons : ${probe.duplicate_count})`);
      if (probe.sample_articles.length > 0) {
        console.log(`  ✓ Exemple : "${probe.sample_articles[0].title.slice(0, 60)}..."`);
      }
    } else if (probe.rate_limited) {
      results.summary.rate_limited_count++;
      console.log(`  ⚠ Rate Limit GDELT (HTTP 429) : ${probe.error}`);
    } else {
      results.summary.error_count++;
      console.log(`  ✗ Erreur (${probe.http_status || 'Network'}) : ${probe.error}`);
    }

    // Cooldown avant la requête suivante pour éviter de spammer le serveur GDELT
    if (i < TARGET_DOMAINS.length - 1) {
      console.log(`  Attente de ${DELAY_BETWEEN_REQUESTS_MS / 1000}s (politique GDELT 1 req/5s)...`);
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  // Enregistrement du rapport
  const reportPath = path.resolve('reports/feasibility-latest.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(65));
  console.log(`Rapport généré avec succès dans : ${reportPath}`);
  console.log(`Succès : ${results.summary.success_count} | Rate Limit (429) : ${results.summary.rate_limited_count} | Erreurs : ${results.summary.error_count}`);
  console.log('='.repeat(65));

  return results;
}

runFeasibilityCheck().catch((err) => {
  console.error('Erreur fatale lors du test de faisabilité :', err);
  process.exit(1);
});
