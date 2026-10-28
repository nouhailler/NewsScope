import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGdeltDate,
  formatRelativeTime,
  resolveAgencyAndCanon,
  computeArticleHash,
  normalizeGdeltArticle,
} from '../src/services/gdeltNormalizer';

describe('GDELT Normalizer Tests', () => {
  test('parseGdeltDate parses valid GDELT 14-character datetime strings', () => {
    // Format: YYYYMMDDTHHMMSSZ -> 20261028T143000Z
    const date = parseGdeltDate('20261028T143000Z');
    assert.strictEqual(date.getUTCFullYear(), 2026);
    assert.strictEqual(date.getUTCMonth(), 9); // October is index 9
    assert.strictEqual(date.getUTCDate(), 28);
    assert.strictEqual(date.getUTCHours(), 14);
    assert.strictEqual(date.getUTCMinutes(), 30);
  });

  test('parseGdeltDate handles fallback on invalid or empty date', () => {
    const fallback = parseGdeltDate('');
    assert.ok(fallback instanceof Date);
    assert.ok(!isNaN(fallback.getTime()));
  });

  test('formatRelativeTime returns French timeago strings', () => {
    const now = new Date('2026-10-28T15:00:00Z');
    const pastMin = new Date('2026-10-28T14:45:00Z');
    const pastHour = new Date('2026-10-28T13:00:00Z');
    const pastDay = new Date('2026-10-26T15:00:00Z');

    assert.strictEqual(formatRelativeTime(pastMin, now), 'Il y a 15 min');
    assert.strictEqual(formatRelativeTime(pastHour, now), 'Il y a 2 h');
    assert.strictEqual(formatRelativeTime(pastDay, now), 'Il y a 2 j');
  });

  test('resolveAgencyAndCanon identifies reuters.com canonically', () => {
    const res = resolveAgencyAndCanon('www.reuters.com');
    assert.strictEqual(res.agency, 'reuters');
    assert.strictEqual(res.agencyLabel, 'REUTERS');
    assert.strictEqual(res.isCanonical, true);
    assert.strictEqual(res.isThirdPartyMention, false);
  });

  test('resolveAgencyAndCanon identifies bloomberg.com canonically', () => {
    const res = resolveAgencyAndCanon('bloomberg.com');
    assert.strictEqual(res.agency, 'bloomberg');
    assert.strictEqual(res.agencyLabel, 'BLOOMBERG');
    assert.strictEqual(res.isCanonical, true);
    assert.strictEqual(res.isThirdPartyMention, false);
  });

  test('resolveAgencyAndCanon identifies afp.com canonically', () => {
    const res = resolveAgencyAndCanon('afp.com');
    assert.strictEqual(res.agency, 'afp');
    assert.strictEqual(res.agencyLabel, 'AFP');
    assert.strictEqual(res.isCanonical, true);
    assert.strictEqual(res.isThirdPartyMention, false);
  });

  test('resolveAgencyAndCanon flags third-party syndication without canonical domain', () => {
    const res = resolveAgencyAndCanon('daily-finances.fr');
    assert.strictEqual(res.isCanonical, false);
    assert.strictEqual(res.isThirdPartyMention, true);
    assert.strictEqual(res.thirdPartySource, 'daily-finances.fr');
    assert.ok(res.thirdPartyWarning?.includes('daily-finances.fr'));
  });

  test('computeArticleHash returns deterministic hex-based hash', () => {
    const h1 = computeArticleHash('https://reuters.com/markets', 'Taux BCE');
    const h2 = computeArticleHash('https://reuters.com/markets', 'Taux BCE');
    assert.strictEqual(h1, h2);
  });

  test('normalizeGdeltArticle converts raw API object into Dispatch interface', () => {
    const raw = {
      url: 'https://www.reuters.com/markets/rates?utm_source=twitter&fbclid=123',
      title: 'BCE : maintien des taux d’intérêt',
      seendate: '20261028T100000Z',
      domain: 'reuters.com',
      language: 'fra',
    };

    const dispatch = normalizeGdeltArticle(raw, 0);

    assert.strictEqual(dispatch.agency, 'reuters');
    assert.strictEqual(dispatch.isMock, false);
    assert.strictEqual(dispatch.title, 'BCE : maintien des taux d’intérêt');
    assert.strictEqual(dispatch.cleanedUrl, 'https://www.reuters.com/markets/rates');
    assert.strictEqual(dispatch.removedTrackersCount, 2);
    assert.strictEqual(dispatch.isCanonical, true);
  });
});
