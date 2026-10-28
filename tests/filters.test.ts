import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildGdeltQueryUrl } from '../src/services/gdeltService';

describe('Query Builder & Filter Tests', () => {
  test('buildGdeltQueryUrl builds standard multi-agency query with proxy', () => {
    const url = buildGdeltQueryUrl({
      agencies: { reuters: true, bloomberg: true, afp: true },
      timeWindow: '24h',
      batchLimit: 25,
      sortMode: 'recent',
    }, true);

    assert.ok(url.startsWith('/api/gdelt?'));
    assert.ok(url.includes('domainis%3Areuters.com'));
    assert.ok(url.includes('domainis%3Abloomberg.com'));
    assert.ok(url.includes('domainis%3Aafp.com'));
    assert.ok(url.includes('maxrecords=25'));
    assert.ok(url.includes('timespan=24h'));
    assert.ok(url.includes('sort=DateDesc'));
  });

  test('buildGdeltQueryUrl selectively excludes unchecked agencies', () => {
    const url = buildGdeltQueryUrl({
      agencies: { reuters: true, bloomberg: false, afp: false },
    }, false);

    assert.ok(url.startsWith('https://api.gdeltproject.org/api/v2/doc/doc?'));
    assert.ok(url.includes('domainis%3Areuters.com'));
    assert.ok(!url.includes('domainis%3Abloomberg.com'));
    assert.ok(!url.includes('domainis%3Aafp.com'));
  });

  test('buildGdeltQueryUrl appends keyword constraints correctly', () => {
    const url = buildGdeltQueryUrl({
      keyword: 'taux BCE',
    }, true);

    // ("taux BCE") encoded in query param
    assert.ok(url.includes('taux+BCE') || url.includes('taux%20BCE'));
  });

  test('buildGdeltQueryUrl switches sort to ToneDesc for relevance sorting', () => {
    const url = buildGdeltQueryUrl({
      sortMode: 'relevance',
    }, true);

    assert.ok(url.includes('sort=ToneDesc'));
  });
});
