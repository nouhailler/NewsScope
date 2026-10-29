import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DISPATCHES } from '../src/data/mockDispatches';
import { Dispatch, DataSourceMode } from '../src/types';

describe('Mode Separation & Detail View Isolation Tests', () => {
  // Fonction simulant exactement le sélecteur memoïsé de App.tsx
  function computeActiveDispatches(
    isOffline: boolean,
    dataMode: DataSourceMode,
    liveDispatches: Dispatch[],
    cachedDispatches: Dispatch[]
  ): Dispatch[] {
    if (isOffline) {
      return cachedDispatches;
    }
    if (dataMode === 'live') {
      return liveDispatches;
    }
    return INITIAL_DISPATCHES;
  }

  // Fonction simulant la sélection du détail de App.tsx
  function computeCurrentDispatch(
    activeDispatches: Dispatch[],
    selectedId: string | null
  ): Dispatch | null {
    if (selectedId) {
      const match = activeDispatches.find((d) => d.id === selectedId);
      if (match) return match;
    }
    return activeDispatches[0] || null;
  }

  // Fonction simulant le pool de favoris
  function computeFavoritesPool(
    dataMode: DataSourceMode,
    liveDispatches: Dispatch[],
    cachedDispatches: Dispatch[]
  ): Dispatch[] {
    const map = new Map<string, Dispatch>();
    if (dataMode === 'demo') {
      INITIAL_DISPATCHES.forEach((d) => map.set(d.id, d));
    }
    cachedDispatches.forEach((d) => map.set(d.id, d));
    liveDispatches.forEach((d) => map.set(d.id, d));
    return Array.from(map.values());
  }

  test('Live mode with empty stream returns empty list without falling back to mock dispatches', () => {
    const liveDispatches: Dispatch[] = [];
    const cachedDispatches: Dispatch[] = [];
    const active: Dispatch[] = computeActiveDispatches(false, 'live', liveDispatches, cachedDispatches);

    assert.strictEqual(active.length, 0);
    assert.deepStrictEqual(active, []);
    // Must NOT contain any mock dispatch
    assert.strictEqual(active.some((d: Dispatch) => d.isMock), false);
  });

  test('Offline mode with empty cache returns empty list without falling back to mock dispatches', () => {
    const liveDispatches: Dispatch[] = [];
    const cachedDispatches: Dispatch[] = [];
    const active: Dispatch[] = computeActiveDispatches(true, 'live', liveDispatches, cachedDispatches);

    assert.strictEqual(active.length, 0);
    assert.deepStrictEqual(active, []);
    assert.strictEqual(active.some((d: Dispatch) => d.isMock), false);
  });

  test('Demo mode strictly returns synthetic mock dispatches with explicit isMock flag', () => {
    const liveDispatches: Dispatch[] = [];
    const cachedDispatches: Dispatch[] = [];
    const active = computeActiveDispatches(false, 'demo', liveDispatches, cachedDispatches);

    assert.ok(active.length > 0);
    assert.strictEqual(active, INITIAL_DISPATCHES);
    assert.ok(active.every((d) => d.isMock === true));
  });

  test('Current dispatch in empty live stream resolves to null instead of mock article', () => {
    const activeDispatches: Dispatch[] = [];
    const current = computeCurrentDispatch(activeDispatches, 'doc_reuters_88c2f1');

    // STRICT AUDIT REQUIREMENT: must be null, NEVER INITIAL_DISPATCHES[0]!
    assert.strictEqual(current, null);
  });

  test('Current dispatch in empty offline cache resolves to null instead of mock article', () => {
    const activeDispatches: Dispatch[] = [];
    const current = computeCurrentDispatch(activeDispatches, null);

    assert.strictEqual(current, null);
  });

  test('Favorites pool does NOT include mock dispatches when in live or offline mode', () => {
    const liveDispatches: Dispatch[] = [
      {
        id: 'real_1',
        isMock: false,
        agency: 'reuters',
        agencyLabel: 'REUTERS',
        agencyClass: '',
        isCanonical: true,
        isVerified: true,
        timestamp: new Date().toISOString(),
        timeAgo: 'À l’instant',
        utcTime: '12:00:00 UTC',
        title: 'Vraie dépêche Reuters',
        excerpt: 'Extrait réel',
        category: 'FINANCE',
        thematicTags: [],
        sha256: 'a'.repeat(64),
        canonicalUrl: 'https://reuters.com/article/1',
        cleanedUrl: 'https://reuters.com/article/1',
        removedTrackersCount: 0,
        gkgId: '1',
        offlineAvailable: true,
        language: 'fra',
      },
    ];
    const cachedDispatches: Dispatch[] = [];

    // In live mode: pool must contain ONLY real dispatches
    const livePool = computeFavoritesPool('live', liveDispatches, cachedDispatches);
    assert.strictEqual(livePool.length, 1);
    assert.strictEqual(livePool[0].id, 'real_1');
    assert.strictEqual(livePool.some((d) => d.isMock), false);

    // In demo mode: pool includes demo dispatches
    const demoPool = computeFavoritesPool('demo', liveDispatches, cachedDispatches);
    assert.ok(demoPool.some((d) => d.isMock));
  });

  test('Mode transitions correctly swap data streams without cross-contamination', () => {
    let mode: DataSourceMode = 'demo';
    let isOffline = false;
    const liveDispatches: Dispatch[] = [];
    const cachedDispatches: Dispatch[] = [];

    // 1. Initial demo mode
    let active = computeActiveDispatches(isOffline, mode, liveDispatches, cachedDispatches);
    assert.strictEqual(active.length, INITIAL_DISPATCHES.length);

    // 2. Switch to live
    mode = 'live';
    active = computeActiveDispatches(isOffline, mode, liveDispatches, cachedDispatches);
    assert.strictEqual(active.length, 0);

    // 3. Switch to offline
    isOffline = true;
    active = computeActiveDispatches(isOffline, mode, liveDispatches, cachedDispatches);
    assert.strictEqual(active.length, 0);

    // 4. Return to demo
    isOffline = false;
    mode = 'demo';
    active = computeActiveDispatches(isOffline, mode, liveDispatches, cachedDispatches);
    assert.strictEqual(active.length, INITIAL_DISPATCHES.length);
  });
});
