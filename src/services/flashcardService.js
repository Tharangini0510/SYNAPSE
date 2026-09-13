// =============================================================
// services/flashcardService.js – Firestore for Flashcards
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

function flashcardsCol(uid) {
  return collection(db, 'users', uid, 'flashcards');
}

export function mapFlashcard(id, data) {
  return {
    id,
    front: data.front || '',
    back: data.back || '',
    subject: data.subject || 'Other',
    difficulty: data.difficulty || 'unreviewed', // 'easy' | 'medium' | 'hard' | 'unreviewed'
    lastReviewed: data.lastReviewed || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeToFlashcards(uid, callback, onError) {
  const q = query(flashcardsCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapFlashcard(d.id, d.data()));
      callback(list);
    },
    onError
  );
}

export async function createFlashcard(uid, cardData) {
  const docRef = await addDoc(flashcardsCol(uid), {
    front: cardData.front,
    back: cardData.back,
    subject: cardData.subject || 'Other',
    difficulty: cardData.difficulty || 'unreviewed',
    lastReviewed: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFlashcard(uid, cardId, data) {
  await updateDoc(doc(db, 'users', uid, 'flashcards', cardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateFlashcardDifficulty(uid, cardId, difficulty) {
  await updateDoc(doc(db, 'users', uid, 'flashcards', cardId), {
    difficulty,
    lastReviewed: new Date().toISOString().split('T')[0],
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFlashcard(uid, cardId) {
  await deleteDoc(doc(db, 'users', uid, 'flashcards', cardId));
}
