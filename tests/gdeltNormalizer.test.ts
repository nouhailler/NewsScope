import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGdeltDate,
  formatRelativeTime,
  extractHostname,
  isLegitimateAgencyDomain,
  isValidHttpUrl,
  resolveAgencyAndCanon,
  calculateSha256,
  normalizeGdeltArticle,
} from '../src/services/gdeltNormalizer';

describe('GDELT Normalizer & Provenance Tests', () => {
  test('extractHostname cleans protocols and leading www.', () => {
    assert.strictEqual(extractHostname('https://www.reuters.com/article'), 'reuters.com');
    assert.strictEqual(extractHostname('http://bloomberg.com/news'), 'bloomberg.com');
    assert.strictEqual(extractHostname('www.afp.com'), 'afp.com');
    assert.strictEqual(extractHostname('sub.domain.co.uk'), 'sub.domain.co.uk');
  });

  test('isLegitimateAgencyDomain validates exact domains and legitimate subdomains', () => {
    assert.strictEqual(isLegitimateAgencyDomain('reuters.com', 'reuters.com'), true);
    assert.strictEqual(isLegitimateAgencyDomain('jp.reuters.com', 'reuters.com'), true);
    assert.strictEqual(isLegitimateAgencyDomain('bloomberg.com', 'bloomberg.com'), true);
    assert.strictEqual(isLegitimateAgencyDomain('afp.com', 'afp.com'), true);
  });

  test('isLegitimateAgencyDomain rejects spoofed and poisoned domain attacks (negative tests)', () => {
    // Negative test 1: domain suffix attack
    assert.strictEqual(isLegitimateAgencyDomain('reuters.com.example.org', 'reuters.com'), false);
    // Negative test 2: hyphenated fake domain
    assert.strictEqual(isLegitimateAgencyDomain('fake-bloomberg.com', 'bloomberg.com'), false);
    // Negative test 3: prefix spoofing
    assert.strictEqual(isLegitimateAgencyDomain('notreuters.com', 'reuters.com'), false);
    // Negative test 4: afp suffix attack
    assert.strictEqual(isLegitimateAgencyDomain('afp.com.malicious.net', 'afp.com'), false);
  });

  test('isValidHttpUrl strictly validates HTTP and HTTPS URLs', () => {
    assert.strictEqual(isValidHttpUrl('https://www.reuters.com/markets'), true);
    assert.strictEqual(isValidHttpUrl('http://bloomberg.com'), true);
    assert.strictEqual(isValidHttpUrl('ftp://example.com'), false);
    assert.strictEqual(isValidHttpUrl('javascript:alert(1)'), false);
    assert.strictEqual(isValidHttpUrl('not-a-valid-url'), false);
    assert.strictEqual(isValidHttpUrl(''), false);
  });

  test('resolveAgencyAndCanon identifies reuters canonically', () => {
    const res = resolveAgencyAndCanon('https://www.reuters.com/markets/deals');
    assert.strictEqual(res.agency, 'reuters');
    assert.strictEqual(res.agencyLabel, 'REUTERS');
    assert.strictEqual(res.isCanonical, true);
    assert.strictEqual(res.isThirdPartyMention, false);
  });

  test('resolveAgencyAndCanon identifies bloomberg canonically', () => {
    const res = resolveAgencyAndCanon('https://bloomberg.com/news/articles');
    assert.strictEqual(res.agency, 'bloomberg');
    assert.strictEqual(res.agencyLabel, 'BLOOMBERG');
    assert.strictEqual(res.isCanonical, true);
    assert.strictEqual(res.isThirdPartyMention, false);
  });

  test('resolveAgencyAndCanon identifies afp canonically', () => {
    const res = resolveAgencyAndCanon('https://afp.com/fr/actu');
    assert.strictEqual(res.agency, 'afp');
    assert.strictEqual(res.agencyLabel, 'AFP');
    assert.strictEqual(res.isCanonical, true);
    assert.strictEqual(res.isThirdPartyMention, false);
  });

  test('resolveAgencyAndCanon assigns "other" to unknown sources without defaulting to AFP', () => {
    const res = resolveAgencyAndCanon('https://daily-finances.fr/article-123');
    assert.strictEqual(res.agency, 'other'); // MUST NOT be 'afp'!
    assert.strictEqual(res.isCanonical, false);
    assert.strictEqual(res.isThirdPartyMention, true);
    assert.strictEqual(res.thirdPartySource, 'daily-finances.fr');
    assert.ok(res.thirdPartyWarning?.includes('daily-finances.fr'));
  });

  test('parseGdeltDate parses valid GDELT 14-character datetime strings', () => {
    const { date, isValid } = parseGdeltDate('20261028T143000Z');
    assert.strictEqual(isValid, true);
    assert.strictEqual(date.getUTCFullYear(), 2026);
    assert.strictEqual(date.getUTCMonth(), 9); // October
    assert.strictEqual(date.getUTCDate(), 28);
    assert.strictEqual(date.getUTCHours(), 14);
    assert.strictEqual(date.getUTCMinutes(), 30);
  });

  test('parseGdeltDate flags invalid dates as invalid instead of defaulting to current time', () => {
    const res1 = parseGdeltDate('');
    assert.strictEqual(res1.isValid, false);

    const res2 = parseGdeltDate('corrupted-date');
    assert.strictEqual(res2.isValid, false);
  });

  test('calculateSha256 computes authentic 64-hex cryptographic hash', () => {
    // Test vector: SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const emptyHash = calculateSha256('');
    assert.strictEqual(emptyHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    // Deterministic test
    const h1 = calculateSha256('https://reuters.com/news::Titre A');
    const h2 = calculateSha256('https://reuters.com/news::Titre A');
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });

  test('normalizeGdeltArticle rejects articles without valid URL', () => {
    const invalidRaw = {
      title: 'Article sans URL',
      seendate: '20261028T100000Z',
    };
    const res = normalizeGdeltArticle(invalidRaw, 0);
    assert.strictEqual(res, null);
  });

  test('normalizeGdeltArticle normalizes valid article without fabricating uncalculated metrics', () => {
    const raw = {
      url: 'https://www.reuters.com/markets/rates?utm_source=twitter&fbclid=123',
      title: 'BCE : maintien des taux d’intérêt',
      seendate: '20261028T100000Z',
      domain: 'reuters.com',
      language: 'fra',
    };

    const dispatch = normalizeGdeltArticle(raw, 0);
    assert.ok(dispatch !== null);
    assert.strictEqual(dispatch.agency, 'reuters');
    assert.strictEqual(dispatch.isMock, false);
    assert.strictEqual(dispatch.title, 'BCE : maintien des taux d’intérêt');
    assert.strictEqual(dispatch.cleanedUrl, 'https://www.reuters.com/markets/rates');
    assert.strictEqual(dispatch.removedTrackersCount, 2);
    assert.strictEqual(dispatch.isCanonical, true);
    // Uncalculated metrics must be undefined, not fabricated
    assert.strictEqual(dispatch.confidenceScore, undefined);
    assert.strictEqual(dispatch.sentimentScore, undefined);
    assert.strictEqual(dispatch.mediaVelocity, undefined);
  });
});
