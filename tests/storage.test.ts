import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeUrl,
  calculateStorageSize,
  getStoredFavorites,
} from '../src/utils/storage';
import { Dispatch } from '../src/types';

describe('Storage & URL Sanitization Tests', () => {
  test('sanitizeUrl removes marketing and attribution query parameters', () => {
    const rawUrl = 'https://www.bloomberg.com/news/article-1?utm_source=newsletter&utm_medium=email&utm_campaign=daily&fbclid=abcdef123&cmpid=999';
    const { cleanedUrl, removedCount } = sanitizeUrl(rawUrl);

    assert.strictEqual(cleanedUrl, 'https://www.bloomberg.com/news/article-1');
    assert.strictEqual(removedCount, 5);
  });

  test('sanitizeUrl preserves legitimate query parameters', () => {
    const rawUrl = 'https://www.reuters.com/search?q=inflation&page=2&utm_source=twitter';
    const { cleanedUrl, removedCount } = sanitizeUrl(rawUrl);

    assert.strictEqual(cleanedUrl, 'https://www.reuters.com/search?q=inflation&page=2');
    assert.strictEqual(removedCount, 1);
  });

  test('sanitizeUrl handles invalid URLs gracefully without throwing', () => {
    const invalid = 'not-a-valid-url';
    const res = sanitizeUrl(invalid);
    assert.strictEqual(res.cleanedUrl, invalid);
    assert.strictEqual(res.removedCount, 0);
  });

  test('calculateStorageSize formats 0 dispatches as empty cache', () => {
    const formatted = calculateStorageSize([]);
    assert.strictEqual(formatted, '0 Ko (Cache vide)');
  });

  test('calculateStorageSize calculates non-zero allocation estimation', () => {
    const dummy = [
      { id: '1' } as Dispatch,
      { id: '2' } as Dispatch,
    ];
    const formatted = calculateStorageSize(dummy);
    assert.ok(formatted.includes('Ko alloués'));
  });

  test('getStoredFavorites returns empty array [] in non-browser or empty environment', () => {
    // In Node.js test environment, localStorage is undefined or empty
    const favs = getStoredFavorites();
    assert.ok(Array.isArray(favs));
    assert.strictEqual(favs.length, 0);
  });

  test('sanitizeUrl handles deduplication of same article with different tracking tokens', () => {
    const urlFromTwitter = 'https://www.reuters.com/markets/deals?utm_source=twitter&utm_medium=social';
    const urlFromNewsletter = 'https://www.reuters.com/markets/deals?utm_source=newsletter&utm_campaign=morning';

    const clean1 = sanitizeUrl(urlFromTwitter).cleanedUrl;
    const clean2 = sanitizeUrl(urlFromNewsletter).cleanedUrl;

    assert.strictEqual(clean1, clean2);
    assert.strictEqual(clean1, 'https://www.reuters.com/markets/deals');
  });
});
