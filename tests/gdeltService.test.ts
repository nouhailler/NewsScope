import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchLiveGdeltDispatches,
  resetRateLimitCooldownForTests,
  buildGdeltQueryUrl,
} from '../src/services/gdeltService';

describe('GDELT Service & Live Connector Tests', () => {
  beforeEach(() => {
    resetRateLimitCooldownForTests();
  });

  test('fetchLiveGdeltDispatches successfully parses 200 OK response with articles', async () => {
    const mockArticles = [
      {
        url: 'https://www.reuters.com/markets/deals/merger-2026',
        title: 'Fusion bancaire validée en zone euro',
        seendate: '20261028T140000Z',
        domain: 'reuters.com',
        language: 'fra',
      },
    ];

    const mockFetch = async () =>
      new Response(JSON.stringify({ articles: mockArticles }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const result = await fetchLiveGdeltDispatches({}, mockFetch as any);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.httpStatus, 200);
    assert.strictEqual(result.dispatches.length, 1);
    assert.strictEqual(result.dispatches[0].agency, 'reuters');
    assert.strictEqual(result.rateLimited, false);
    assert.strictEqual(result.error, null);
  });

  test('fetchLiveGdeltDispatches handles HTTP 429 Too Many Requests with rate limit alert', async () => {
    const mockFetch = async () =>
      new Response('Please limit requests to one every 5 seconds', {
        status: 429,
        statusText: 'Too Many Requests',
      });

    const result = await fetchLiveGdeltDispatches({}, mockFetch as any);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.httpStatus, 429);
    assert.strictEqual(result.rateLimited, true);
    assert.ok(result.error?.includes('429'));
    assert.strictEqual(result.dispatches.length, 0);
  });

  test('fetchLiveGdeltDispatches handles invalid non-JSON response gracefully', async () => {
    const mockFetch = async () =>
      new Response('<html><body>Error 500 Internal Server Error</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });

    const result = await fetchLiveGdeltDispatches({}, mockFetch as any);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.dispatches.length, 0);
    assert.ok(result.error?.includes('JSON'));
  });

  test('fetchLiveGdeltDispatches handles empty articles array without crashing', async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify({ articles: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const result = await fetchLiveGdeltDispatches({}, mockFetch as any);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dispatches.length, 0);
    assert.strictEqual(result.error, null);
  });

  test('fetchLiveGdeltDispatches handles network timeout (AbortError)', async () => {
    const mockFetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    const result = await fetchLiveGdeltDispatches({}, mockFetch as any);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.dispatches.length, 0);
    assert.ok(result.error?.includes('Délai d’attente dépassé') || result.error?.includes('Timeout'));
  });

  test('fetchLiveGdeltDispatches prevents concurrent requests while one is in progress', async () => {
    let resolver: (res: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolver = resolve;
    });

    const slowFetch = async () => pendingPromise;

    // Launch first request
    const promise1 = fetchLiveGdeltDispatches({}, slowFetch as any);

    // Launch second concurrent request immediately
    const result2 = await fetchLiveGdeltDispatches({}, slowFetch as any);

    assert.strictEqual(result2.success, false);
    assert.ok(result2.error?.includes('déjà en cours d’exécution'));

    // Resolve first request
    resolver!(new Response(JSON.stringify({ articles: [] }), { status: 200 }));
    const result1 = await promise1;
    assert.strictEqual(result1.success, true);
  });

  test('fetchLiveGdeltDispatches attempts direct URL fallback when proxy returns 404', async () => {
    const calls: string[] = [];

    const fallbackFetch = async (url: RequestInfo | URL) => {
      const urlStr = String(url);
      calls.push(urlStr);
      if (urlStr.startsWith('/api/gdelt')) {
        return new Response('Not Found', { status: 404 });
      }
      return new Response(JSON.stringify({ articles: [] }), { status: 200 });
    };

    const result = await fetchLiveGdeltDispatches({}, fallbackFetch as any);

    assert.strictEqual(result.success, true);
    assert.strictEqual(calls.length, 2);
    assert.ok(calls[0].startsWith('/api/gdelt'));
    assert.ok(calls[1].startsWith('https://api.gdeltproject.org'));
  });
});
