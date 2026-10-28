import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getFreshnessInfo } from '../src/utils/dateUtils';

describe('Date & Freshness Utility Tests', () => {
  test('categorizes breaking news under 60 minutes as ultra-frais', () => {
    const now = new Date('2026-10-28T14:30:00Z');
    const past15m = new Date('2026-10-28T14:15:00Z').toISOString();

    const info = getFreshnessInfo(past15m, now, false);
    assert.strictEqual(info.freshnessCategory, 'breaking');
    assert.strictEqual(info.isFresh, true);
    assert.ok(info.freshnessBadgeLabel.includes('ULTRA-FRAIS'));
    assert.strictEqual(info.dayLabel, "Aujourd'hui");
    assert.strictEqual(info.timeLabel, '14:15:00 UTC');
  });

  test('categorizes news between 1 and 6 hours as recent', () => {
    const now = new Date('2026-10-28T14:30:00Z');
    const past3h = new Date('2026-10-28T11:30:00Z').toISOString();

    const info = getFreshnessInfo(past3h, now, false);
    assert.strictEqual(info.freshnessCategory, 'fresh');
    assert.strictEqual(info.isFresh, true);
    assert.ok(info.freshnessBadgeLabel.includes('RÉCENT'));
  });

  test('categorizes news from yesterday', () => {
    const now = new Date('2026-10-28T14:30:00Z');
    const yesterday = new Date('2026-10-27T10:00:00Z').toISOString();

    const info = getFreshnessInfo(yesterday, now, false);
    assert.strictEqual(info.freshnessCategory, 'yesterday');
    assert.strictEqual(info.dayLabel, 'Hier');
    assert.strictEqual(info.isFresh, false);
  });

  test('flags mock/synthetic test data explicitly with warning badge', () => {
    const now = new Date('2026-10-28T14:30:00Z');
    const mockDate = '2025-03-30T14:02:44Z';

    const info = getFreshnessInfo(mockDate, now, true);
    assert.strictEqual(info.freshnessCategory, 'test-data');
    assert.ok(info.freshnessBadgeLabel.includes('DÉMO') || info.freshnessBadgeLabel.includes('SYNTHÉTIQUE'));
    assert.strictEqual(info.isFresh, false);
    assert.ok(info.dayLabel.includes('2025'));
    assert.strictEqual(info.timeLabel, '14:02:44 UTC');
  });

  test('handles missing or empty date explicitly without defaulting to current time', () => {
    const info = getFreshnessInfo('');
    assert.strictEqual(info.isFresh, false);
    assert.strictEqual(info.dayLabel, 'Date non fournie');
    assert.ok(info.freshnessBadgeLabel.includes('INDISPONIBLE'));
  });

  test('handles invalid date strings explicitly without defaulting to current time', () => {
    const info = getFreshnessInfo('not-a-date');
    assert.strictEqual(info.isFresh, false);
    assert.strictEqual(info.dayLabel, 'Date invalide');
    assert.ok(info.freshnessBadgeLabel.includes('INVALIDE'));
  });
});
