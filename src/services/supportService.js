// =============================================================
// services/supportService.js – Firestore for Help & Support tickets
// =============================================================
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

function ticketsCol() {
  return collection(db, 'supportTickets');
}

export async function submitSupportTicket(uid, userMeta, ticketData) {
  const docRef = await addDoc(ticketsCol(), {
    type: ticketData.type || 'contact', // 'contact' | 'bug_report' | 'feature_request'
    subject: ticketData.subject,
    message: ticketData.message,
    userEmail: userMeta.email || '',
    userId: uid,
    userName: userMeta.name || userMeta.email || 'User',
    status: 'open',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToUserTickets(uid, callback, onError) {
  if (!uid) return () => {};
  const q = query(ticketsCol(), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(list);
    },
    onError
  );
}
