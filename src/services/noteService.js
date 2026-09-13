// =============================================================
// services/noteService.js – Firestore notes subcollection
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

function notesCol(uid) {
  return collection(db, 'users', uid, 'notes');
}

export function mapNote(id, data) {
  const date =
    data.date ||
    (data.updatedAt?.toDate
      ? data.updatedAt.toDate().toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]);

  return {
    id,
    title: data.title || 'Untitled Note',
    subject: data.subject || 'Other',
    folder: data.folder || data.subject || 'Other',
    starred: !!data.starred,
    date,
    content: data.content || '',
    preview: data.preview || (data.content || '').replace(/[#*\n]/g, ' ').slice(0, 100),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeToNotes(uid, callback, onError) {
  const q = query(notesCol(uid), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => mapNote(d.id, d.data())));
    },
    onError
  );
}

export async function createNote(uid, note = {}) {
  const payload = {
    title: note.title || 'Untitled Note',
    subject: note.subject || 'Other',
    folder: note.folder || note.subject || 'Other',
    starred: false,
    date: new Date().toISOString().split('T')[0],
    content: note.content || '# Untitled Note\n\nStart writing here…',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(notesCol(uid), payload);
  return ref.id;
}

export async function updateNote(uid, noteId, data) {
  await updateDoc(doc(db, 'users', uid, 'notes', noteId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(uid, noteId) {
  await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
}
