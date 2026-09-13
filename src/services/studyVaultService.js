// =============================================================
// services/studyVaultService.js – Firestore Resource Vault Service
// =============================================================
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const DB_NAME = 'synapse_resource_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'resources';

/** Local IndexedDB fallback to guarantee persistence even if offline/unreachable */
function openLocalDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const dbInst = e.target.result;
      if (!dbInst.objectStoreNames.contains(STORE_NAME)) {
        dbInst.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalResource(uid, resource) {
  try {
    const dbInst = await openLocalDB();
    const tx = dbInst.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ ...resource, uid });
  } catch (err) {
    console.warn('Local storage save notice:', err);
  }
}

async function getLocalResourcesForUser(uid) {
  try {
    const dbInst = await openLocalDB();
    return new Promise((resolve) => {
      const tx = dbInst.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []).filter((r) => r.uid === uid);
        resolve(list);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function deleteLocalResource(id) {
  try {
    const dbInst = await openLocalDB();
    const tx = dbInst.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {}
}

function resourceCol(uid) {
  return collection(db, 'users', uid, 'studyVault');
}

export function parseTags(tagsInput) {
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tagsInput === 'string') {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function mapVaultResource(id, data) {
  const tags = parseTags(data.tags);
  const dateVal = data.dateAdded || data.uploadDate || new Date().toISOString().split('T')[0];
  return {
    id,
    title: data.title || 'Untitled Resource',
    subject: data.subject || 'Computer Science',
    type: data.type || 'Lecture Notes',
    url: data.url || '#',
    description: data.description || '',
    tags,
    isFavourite: !!data.isFavourite,
    dateAdded: dateVal,
    uploadDate: dateVal, // preserved for legacy compatibility
    userId: data.userId || data.uid || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeToStudyVault(uid, callback, onError) {
  if (!uid) {
    callback([]);
    return () => {};
  }

  let unsub = null;
  let localItems = [];

  getLocalResourcesForUser(uid).then((items) => {
    localItems = items.map((i) => mapVaultResource(i.id, i));
  });

  try {
    const q = query(resourceCol(uid), orderBy('createdAt', 'desc'));
    unsub = onSnapshot(
      q,
      (snap) => {
        const firestoreList = snap.docs.map((d) => mapVaultResource(d.id, d.data()));
        const mergedMap = new Map();
        localItems.forEach((item) => mergedMap.set(item.id, item));
        firestoreList.forEach((item) => mergedMap.set(item.id, item));
        const mergedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
        );
        callback(mergedList);
      },
      (err) => {
        console.warn('Firestore snapshot notice, loading local resource storage:', err);
        getLocalResourcesForUser(uid).then((items) => {
          callback(items.map((i) => mapVaultResource(i.id, i)));
        });
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Subscription notice, returning cached local resources:', err);
    getLocalResourcesForUser(uid).then((items) => {
      callback(items.map((i) => mapVaultResource(i.id, i)));
    });
  }

  return () => {
    if (unsub) unsub();
  };
}

export async function addVaultResource(uid, resourceData) {
  if (!uid) {
    throw new Error('User authentication required.');
  }
  if (!resourceData.title || !resourceData.title.trim()) {
    throw new Error('Resource Title is required.');
  }
  if (!resourceData.url || !resourceData.url.trim()) {
    throw new Error('Resource Link (URL) is required.');
  }

  const timestamp = Date.now();
  const resId = `res_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const tags = parseTags(resourceData.tags);
  const currentDate = new Date().toISOString().split('T')[0];

  const payload = {
    title: resourceData.title.trim(),
    subject: resourceData.subject || 'Computer Science',
    type: resourceData.type || 'Lecture Notes',
    url: resourceData.url.trim(),
    description: (resourceData.description || '').trim(),
    tags,
    isFavourite: !!resourceData.isFavourite,
    dateAdded: currentDate,
    uploadDate: currentDate,
    userId: uid,
  };

  await saveLocalResource(uid, { id: resId, ...payload });

  let docId = resId;
  try {
    const docRef = await addDoc(resourceCol(uid), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    docId = docRef.id;
    await saveLocalResource(uid, { id: docId, ...payload });
  } catch (err) {
    console.warn('Firestore write notice (saved to local persistent storage):', err);
  }

  return docId;
}

export async function updateVaultResource(uid, resourceId, resourceData) {
  if (!uid || !resourceId) return;

  const tags = parseTags(resourceData.tags);
  const payload = {
    title: resourceData.title ? resourceData.title.trim() : 'Untitled Resource',
    subject: resourceData.subject || 'Computer Science',
    type: resourceData.type || 'Lecture Notes',
    url: resourceData.url ? resourceData.url.trim() : '#',
    description: resourceData.description ? resourceData.description.trim() : '',
    tags,
    ...(resourceData.isFavourite !== undefined ? { isFavourite: resourceData.isFavourite } : {}),
  };

  await saveLocalResource(uid, { id: resourceId, ...payload });

  try {
    await updateDoc(doc(db, 'users', uid, 'studyVault', resourceId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore update notice (updated locally):', err);
  }
}

export async function toggleFavouriteResource(uid, resourceId, currentIsFavourite) {
  if (!uid || !resourceId) return;
  const newFav = !currentIsFavourite;

  await saveLocalResource(uid, { id: resourceId, isFavourite: newFav });

  try {
    await updateDoc(doc(db, 'users', uid, 'studyVault', resourceId), {
      isFavourite: newFav,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore favourite toggle notice:', err);
  }
}

export async function deleteVaultResource(uid, resourceId) {
  if (!uid || !resourceId) return;

  await deleteLocalResource(resourceId);

  try {
    await deleteDoc(doc(db, 'users', uid, 'studyVault', resourceId));
  } catch (err) {
    console.warn('Firestore delete notice (deleted locally):', err);
  }
}
