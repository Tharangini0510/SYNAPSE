// =============================================================
// services/quizService.js – Firestore for Quizzes & Attempts
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

function quizzesCol(uid) {
  return collection(db, 'users', uid, 'quizzes');
}

function attemptsCol(uid) {
  return collection(db, 'users', uid, 'quizAttempts');
}

export function mapQuiz(id, data) {
  return {
    id,
    title: data.title || 'Untitled Quiz',
    description: data.description || '',
    subject: data.subject || 'Other',
    questions: Array.isArray(data.questions) ? data.questions : [],
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function mapAttempt(id, data) {
  return {
    id,
    quizId: data.quizId || '',
    quizTitle: data.quizTitle || 'Quiz',
    subject: data.subject || 'Other',
    score: typeof data.score === 'number' ? data.score : 0,
    correctCount: data.correctCount || 0,
    totalQuestions: data.totalQuestions || 0,
    date: data.date || new Date().toISOString().split('T')[0],
    timeSpentSeconds: data.timeSpentSeconds || 0,
    createdAt: data.createdAt || null,
  };
}

export function subscribeToQuizzes(uid, callback, onError) {
  const q = query(quizzesCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapQuiz(d.id, d.data()));
      callback(list);
    },
    onError
  );
}

export function subscribeToQuizAttempts(uid, callback, onError) {
  const q = query(attemptsCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapAttempt(d.id, d.data()));
      callback(list);
    },
    onError
  );
}

export async function createQuiz(uid, quizData) {
  const docRef = await addDoc(quizzesCol(uid), {
    title: quizData.title,
    description: quizData.description || '',
    subject: quizData.subject || 'Other',
    questions: quizData.questions || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateQuiz(uid, quizId, quizData) {
  await updateDoc(doc(db, 'users', uid, 'quizzes', quizId), {
    ...quizData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuiz(uid, quizId) {
  await deleteDoc(doc(db, 'users', uid, 'quizzes', quizId));
}

export async function saveQuizAttempt(uid, attemptData) {
  const docRef = await addDoc(attemptsCol(uid), {
    quizId: attemptData.quizId,
    quizTitle: attemptData.quizTitle,
    subject: attemptData.subject || 'Other',
    score: attemptData.score,
    correctCount: attemptData.correctCount,
    totalQuestions: attemptData.totalQuestions,
    timeSpentSeconds: attemptData.timeSpentSeconds || 0,
    date: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
