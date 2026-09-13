// =============================================================
// services/notificationService.js – Firestore notifications
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
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

function notifsCol(uid) {
  return collection(db, 'users', uid, 'notifications');
}

export function mapNotification(id, data) {
  let timeLabel = data.timeLabel || '';
  if (!timeLabel && data.createdAt?.toDate) {
    const diff = Date.now() - data.createdAt.toDate().getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) timeLabel = 'Just now';
    else if (mins < 60) timeLabel = `${mins}m ago`;
    else if (mins < 1440) timeLabel = `${Math.floor(mins / 60)}h ago`;
    else timeLabel = `${Math.floor(mins / 1440)}d ago`;
  }

  return {
    id,
    text: data.text || '',
    type: data.type || 'info', // danger | success | info
    read: !!data.read,
    time: timeLabel,
    createdAt: data.createdAt || null,
  };
}

export function subscribeToNotifications(uid, callback, onError) {
  const q = query(notifsCol(uid), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => mapNotification(d.id, d.data())));
    },
    onError
  );
}

export async function createNotification(uid, { text, type = 'info' }) {
  const ref = await addDoc(notifsCol(uid), {
    text,
    type,
    read: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markNotificationRead(uid, id) {
  await updateDoc(doc(db, 'users', uid, 'notifications', id), { read: true });
}

export async function deleteNotification(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'notifications', id));
}
