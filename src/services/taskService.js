// =============================================================
// services/taskService.js – Firestore tasks subcollection
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

function tasksCol(uid) {
  return collection(db, 'users', uid, 'tasks');
}

export function mapTask(id, data) {
  return {
    id,
    title: data.title || '',
    subject: data.subject || 'Other',
    priority: data.priority || 'medium',
    due: data.due || '',
    status: data.status || 'todo', // todo | inProgress | done
    done: data.status === 'done' || !!data.done,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeToTasks(uid, callback, onError) {
  const q = query(tasksCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapTask(d.id, d.data()));
      callback(list);
    },
    onError
  );
}

export async function createTask(uid, task) {
  const ref = await addDoc(tasksCol(uid), {
    title: task.title,
    subject: task.subject || 'Other',
    priority: task.priority || 'medium',
    due: task.due || '',
    status: task.status || 'todo',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTask(uid, taskId, data) {
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(uid, taskId) {
  await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
}

export async function moveTaskStatus(uid, taskId, status) {
  await updateTask(uid, taskId, { status, done: status === 'done' });
}

/** Group flat task list into board columns */
export function groupTasksByStatus(tasks) {
  return {
    todo: tasks.filter((t) => t.status === 'todo'),
    inProgress: tasks.filter((t) => t.status === 'inProgress'),
    done: tasks.filter((t) => t.status === 'done'),
  };
}
