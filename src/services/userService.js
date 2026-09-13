// =============================================================
// services/userService.js – Firestore users collection
// =============================================================
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const USERS = 'users';

/** Default settings nested on the user document */
export const DEFAULT_SETTINGS = {
  darkMode: false,
  sound: true,
  language: 'en',
  timezone: 'Asia/Kolkata',
  emailNotifications: true,
  pushNotifications: false,
  reminderTime: '09:00',
  studyPreference: 'balanced',
  pomodoro: {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
  },
};

export const DEFAULT_STUDY_STATS = {
  streak: 0,
  lastStudyDate: null,
  totalFocusMinutes: 0,
  focusSessionsToday: 0,
  focusSessionsDate: null,
  weeklyProgress: 0,
};

/**
 * Build the canonical user document shape.
 */
export function buildUserDocument(firebaseUser, extras = {}) {
  const now = serverTimestamp();
  return {
    uid: firebaseUser.uid,
    displayName: extras.displayName ?? firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    photoURL: extras.photoURL ?? firebaseUser.photoURL ?? null,
    university: extras.university ?? '',
    course: extras.course ?? '',
    semester: extras.semester ?? '',
    studyPreference: extras.studyPreference ?? 'balanced',
    adaptiveSettings: extras.adaptiveSettings ?? {
      mode: 'normal',
      semesterStart: '',
      semesterEnd: '',
    },
    theme: extras.theme ?? 'light',
    bio: extras.bio ?? '',
    gpa: extras.gpa ?? '',
    courses: extras.courses ?? [],
    setupCompleted: extras.setupCompleted ?? false,
    settings: extras.settings ?? { ...DEFAULT_SETTINGS },
    studyStats: extras.studyStats ?? { ...DEFAULT_STUDY_STATS },
    createdAt: extras.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * Map Firestore user doc to the shape existing UI expects
 * (name, university, avatar, etc.) while keeping Firebase fields.
 */
export function mapUserProfile(data, firebaseUser = null) {
  if (!data && !firebaseUser) return null;
  const d = data || {};
  const displayName =
    d.displayName ||
    firebaseUser?.displayName ||
    (firebaseUser?.email ? firebaseUser.email.split('@')[0] : '') ||
    '';

  // Existing accounts may predate setupCompleted — infer "done" safely without
  // skipping brand-new signups (university alone is set at registration).
  const hasLegacyProfile = !!(
    d.course ||
    d.semester ||
    d.bio ||
    d.gpa ||
    (Array.isArray(d.courses) && d.courses.length > 0) ||
    d.adaptiveSettings?.semesterStart ||
    d.adaptiveSettings?.semesterEnd ||
    (d.adaptiveSettings?.mode && d.adaptiveSettings.mode !== 'normal')
  );
  const setupCompleted =
    d.setupCompleted === true ||
    (d.setupCompleted !== true && hasLegacyProfile);

  return {
    uid: d.uid || firebaseUser?.uid,
    id: d.uid || firebaseUser?.uid,
    name: displayName,
    displayName,
    email: d.email || firebaseUser?.email || '',
    photoURL: d.photoURL || firebaseUser?.photoURL || null,
    avatar: d.photoURL || firebaseUser?.photoURL || null,
    university: d.university || '',
    course: d.course || '',
    major: d.course || '',
    semester: d.semester || '',
    year: d.semester || '',
    studyPreference: d.studyPreference || 'balanced',
    adaptiveSettings: d.adaptiveSettings || { mode: 'normal', semesterStart: '', semesterEnd: '' },
    theme: d.theme || 'light',
    bio: d.bio || '',
    gpa: d.gpa || '',
    courses: d.courses || [],
    setupCompleted,
    settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) },
    studyStats: { ...DEFAULT_STUDY_STATS, ...(d.studyStats || {}) },
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null,
    joinedAt: d.createdAt || null,
  };
}

/**
 * Ensure a users/{uid} document exists; create if missing.
 */
export async function ensureUserDocument(firebaseUser, extras = {}) {
  const ref = doc(db, USERS, firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const payload = buildUserDocument(firebaseUser, extras);
    await setDoc(ref, payload);
    const created = await getDoc(ref);
    return mapUserProfile(created.data() || payload, firebaseUser);
  }

  // Merge any provided extras (e.g. name on first Google login)
  const existing = snap.data();
  const patch = {};
  if (extras.displayName && !existing.displayName) patch.displayName = extras.displayName;
  if (extras.university && !existing.university) patch.university = extras.university;
  // Only stamp setupCompleted:false for brand-new docs that lack the field
  if (extras.setupCompleted === false && existing.setupCompleted === undefined) {
    patch.setupCompleted = false;
  }
  // Backfill setupCompleted for users who already have onboarding/profile fields
  if (existing.setupCompleted !== true) {
    const established = !!(
      existing.course ||
      existing.semester ||
      existing.bio ||
      existing.gpa ||
      (Array.isArray(existing.courses) && existing.courses.length > 0) ||
      existing.adaptiveSettings?.semesterStart ||
      existing.adaptiveSettings?.semesterEnd ||
      (existing.adaptiveSettings?.mode && existing.adaptiveSettings.mode !== 'normal')
    );
    if (established) patch.setupCompleted = true;
  }
  if (Object.keys(patch).length > 0) {
    patch.updatedAt = serverTimestamp();
    await updateDoc(ref, patch);
    const updated = await getDoc(ref);
    return mapUserProfile(updated.data(), firebaseUser);
  }

  return mapUserProfile(existing, firebaseUser);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return null;
  return mapUserProfile(snap.data());
}

export async function updateUserProfile(uid, data) {
  const ref = doc(db, USERS, uid);
  const payload = { ...data, updatedAt: serverTimestamp() };
  // Normalize UI field aliases
  if (payload.name && !payload.displayName) {
    payload.displayName = payload.name;
    delete payload.name;
  }
  if (payload.major && !payload.course) {
    payload.course = payload.major;
    delete payload.major;
  }
  if (payload.year && !payload.semester) {
    payload.semester = payload.year;
    delete payload.year;
  }

  // Merge nested maps with Firestore so partial updates cannot wipe sibling fields
  const nestedKeys = ['adaptiveSettings', 'settings', 'studyStats'];
  const needsMerge = nestedKeys.some(
    (key) => payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])
  );
  if (needsMerge) {
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};
    for (const key of nestedKeys) {
      if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
        const prev = existing[key] && typeof existing[key] === 'object' ? existing[key] : {};
        payload[key] = { ...prev, ...payload[key] };
        if (
          key === 'settings' &&
          payload.settings.pomodoro &&
          typeof payload.settings.pomodoro === 'object'
        ) {
          payload.settings.pomodoro = {
            ...(prev.pomodoro || {}),
            ...payload.settings.pomodoro,
          };
        }
      }
    }
  }

  await updateDoc(ref, payload);
  const snap = await getDoc(ref);
  return mapUserProfile(snap.data());
}

export function subscribeToUserProfile(uid, callback, onError) {
  return onSnapshot(
    doc(db, USERS, uid),
    (snap) => {
      if (snap.exists()) callback(mapUserProfile(snap.data()));
      else callback(null);
    },
    onError
  );
}
