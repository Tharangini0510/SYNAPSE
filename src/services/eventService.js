// =============================================================
// services/eventService.js – Firestore calendar events
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

const TYPE_COLORS = {
  class: '#6366f1',
  assignment: '#f59e0b',
  exam: '#ef4444',
  other: '#10b981',
};

function eventsCol(uid) {
  return collection(db, 'users', uid, 'events');
}

export function mapEvent(id, data) {
  const type = data.type || 'class';
  return {
    id,
    title: data.title || '',
    date: data.date || '',
    time: data.time || '',
    type,
    color: data.color || TYPE_COLORS[type] || TYPE_COLORS.other,
    duration: data.duration || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeToEvents(uid, callback, onError) {
  const q = query(eventsCol(uid), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => mapEvent(d.id, d.data())));
    },
    onError
  );
}

export async function createEvent(uid, event) {
  const type = event.type || 'class';
  const ref = await addDoc(eventsCol(uid), {
    title: event.title,
    date: event.date,
    time: event.time || '',
    type,
    color: event.color || TYPE_COLORS[type] || TYPE_COLORS.other,
    duration: event.duration || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(uid, eventId, data) {
  await updateDoc(doc(db, 'users', uid, 'events', eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(uid, eventId) {
  await deleteDoc(doc(db, 'users', uid, 'events', eventId));
}
