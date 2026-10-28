/**
 * NewsScope — Moteur de persistance IndexedDB réel
 * 
 * Implémente le stockage local décentralisé dans la partition IndexedDB du navigateur.
 * Base : NewsScope_v1
 * Stores :
 * - `dispatches` (clé : `id`) : Cache des dépêches ingérées
 * - `favorites` (clé : `id`) : Liste des identifiants sauvegardés par l'utilisateur
 */

import { Dispatch } from '../types';

const DB_NAME = 'NewsScope_v1';
const DB_VERSION = 1;
const STORE_DISPATCHES = 'dispatches';
const STORE_FAVORITES = 'favorites';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openNewsScopeDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB non disponible dans cet environnement'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DISPATCHES)) {
        db.createObjectStore(STORE_DISPATCHES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
        db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Erreur ouverture IndexedDB'));
    };
  });

  return dbPromise;
}

export async function saveDispatchToIndexedDB(dispatch: Dispatch): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const db = await openNewsScopeDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DISPATCHES, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE_DISPATCHES).put(dispatch);
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de sauvegarde de dépêche :', err);
  }
}

export async function getDispatchFromIndexedDB(id: string): Promise<Dispatch | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  try {
    const db = await openNewsScopeDB();
    return await new Promise<Dispatch | null>((resolve, reject) => {
      const tx = db.transaction(STORE_DISPATCHES, 'readonly');
      tx.onerror = () => reject(tx.error);
      const req = tx.objectStore(STORE_DISPATCHES).get(id);
      req.onsuccess = () => resolve(req.result || null);
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de lecture de dépêche :', err);
    return null;
  }
}

export async function getAllCachedDispatches(): Promise<Dispatch[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];
  try {
    const db = await openNewsScopeDB();
    return await new Promise<Dispatch[]>((resolve, reject) => {
      const tx = db.transaction(STORE_DISPATCHES, 'readonly');
      tx.onerror = () => reject(tx.error);
      const req = tx.objectStore(STORE_DISPATCHES).getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de récupération des dépêches en cache :', err);
    return [];
  }
}

export async function getAllIndexedDBFavorites(): Promise<string[]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];
  try {
    const db = await openNewsScopeDB();
    return await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_FAVORITES, 'readonly');
      tx.onerror = () => reject(tx.error);
      const req = tx.objectStore(STORE_FAVORITES).getAllKeys();
      req.onsuccess = () => resolve(req.result.map(String));
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec lecture favoris, repli localStorage :', err);
    return [];
  }
}

export async function addFavoriteToIndexedDB(id: string, dispatch?: Dispatch): Promise<void> {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const db = await openNewsScopeDB();
    const tx = db.transaction([STORE_FAVORITES, STORE_DISPATCHES], 'readwrite');
    tx.objectStore(STORE_FAVORITES).put({ id, savedAt: new Date().toISOString() });
    if (dispatch) {
      tx.objectStore(STORE_DISPATCHES).put(dispatch);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erreur ajout favori :', err);
  }
}

export async function removeFavoriteFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await openNewsScopeDB();
    const tx = db.transaction(STORE_FAVORITES, 'readwrite');
    tx.objectStore(STORE_FAVORITES).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erreur suppression favori :', err);
  }
}

export async function clearAllIndexedDB(): Promise<void> {
  try {
    const db = await openNewsScopeDB();
    const tx = db.transaction([STORE_FAVORITES, STORE_DISPATCHES], 'readwrite');
    tx.objectStore(STORE_FAVORITES).clear();
    tx.objectStore(STORE_DISPATCHES).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erreur purge complète :', err);
  }
}
