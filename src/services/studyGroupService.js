// =============================================================
// services/studyGroupService.js – Firestore for Study Groups
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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

function groupsCol() {
  return collection(db, 'studyGroups');
}

export function mapStudyGroup(id, data) {
  return {
    id,
    name: data.name || 'Untitled Group',
    description: data.description || '',
    subject: data.subject || 'Other',
    creatorId: data.creatorId || '',
    creatorName: data.creatorName || 'Student',
    members: Array.isArray(data.members) ? data.members : [],
    announcements: Array.isArray(data.announcements) ? data.announcements : [],
    sharedNotes: Array.isArray(data.sharedNotes) ? data.sharedNotes : [],
    sharedVault: Array.isArray(data.sharedVault) ? data.sharedVault : [],
    sharedTasks: Array.isArray(data.sharedTasks) ? data.sharedTasks : [],
    upcomingSessions: Array.isArray(data.upcomingSessions) ? data.upcomingSessions : [],
    createdDate: data.createdDate || new Date().toISOString().split('T')[0],
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export function subscribeToStudyGroups(callback, onError) {
  const q = query(groupsCol(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapStudyGroup(d.id, d.data()));
      callback(list);
    },
    onError
  );
}

export async function createStudyGroup(uid, userMeta, groupData) {
  const memberObj = {
    uid,
    name: userMeta.name || userMeta.email || 'Student',
    email: userMeta.email || '',
    role: 'creator',
    joinedAt: new Date().toISOString().split('T')[0],
  };

  const docRef = await addDoc(groupsCol(), {
    name: groupData.name,
    description: groupData.description || '',
    subject: groupData.subject || 'Other',
    creatorId: uid,
    creatorName: userMeta.name || userMeta.email || 'Student',
    members: [memberObj],
    announcements: [],
    sharedNotes: [],
    sharedVault: [],
    sharedTasks: [],
    upcomingSessions: [],
    createdDate: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function joinStudyGroup(uid, userMeta, groupId, currentMembers = []) {
  if (currentMembers.some((m) => m.uid === uid)) return;

  const memberObj = {
    uid,
    name: userMeta.name || userMeta.email || 'Student',
    email: userMeta.email || '',
    role: 'member',
    joinedAt: new Date().toISOString().split('T')[0],
  };

  await updateDoc(doc(db, 'studyGroups', groupId), {
    members: arrayUnion(memberObj),
    updatedAt: serverTimestamp(),
  });
}

export async function leaveStudyGroup(uid, groupId, currentMembers = []) {
  const targetMember = currentMembers.find((m) => m.uid === uid);
  if (!targetMember) return;

  await updateDoc(doc(db, 'studyGroups', groupId), {
    members: arrayRemove(targetMember),
    updatedAt: serverTimestamp(),
  });
}

export async function removeGroupMember(groupId, memberObj) {
  await updateDoc(doc(db, 'studyGroups', groupId), {
    members: arrayRemove(memberObj),
    updatedAt: serverTimestamp(),
  });
}

export async function updateStudyGroup(groupId, data) {
  await updateDoc(doc(db, 'studyGroups', groupId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudyGroup(groupId) {
  await deleteDoc(doc(db, 'studyGroups', groupId));
}

export async function addGroupAnnouncement(groupId, announcementText, authorName, authorId) {
  const item = {
    id: `ann_${Date.now()}`,
    text: announcementText,
    authorName: authorName || 'Member',
    authorId: authorId || '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  await updateDoc(doc(db, 'studyGroups', groupId), {
    announcements: arrayUnion(item),
    updatedAt: serverTimestamp(),
  });
}

export async function addSharedNoteLink(groupId, noteData) {
  const item = {
    id: `sn_${Date.now()}`,
    title: noteData.title,
    subject: noteData.subject || 'Other',
    url: noteData.url || '',
    sharedBy: noteData.sharedBy || 'Member',
  };
  await updateDoc(doc(db, 'studyGroups', groupId), {
    sharedNotes: arrayUnion(item),
    updatedAt: serverTimestamp(),
  });
}

export async function addSharedVaultLink(groupId, vaultData) {
  const item = {
    id: `sv_${Date.now()}`,
    title: vaultData.title,
    type: vaultData.type || 'Resource',
    url: vaultData.url || '',
    sharedBy: vaultData.sharedBy || 'Member',
  };
  await updateDoc(doc(db, 'studyGroups', groupId), {
    sharedVault: arrayUnion(item),
    updatedAt: serverTimestamp(),
  });
}

export async function addGroupTask(groupId, taskData) {
  const item = {
    id: `gt_${Date.now()}`,
    title: taskData.title,
    done: false,
    assignedTo: taskData.assignedTo || 'Group',
  };
  await updateDoc(doc(db, 'studyGroups', groupId), {
    sharedTasks: arrayUnion(item),
    updatedAt: serverTimestamp(),
  });
}

export async function addStudySession(groupId, sessionData) {
  const item = {
    id: `ss_${Date.now()}`,
    title: sessionData.title,
    date: sessionData.date || new Date().toISOString().split('T')[0],
    time: sessionData.time || '18:00',
    link: sessionData.link || '',
    host: sessionData.host || 'Group',
  };
  await updateDoc(doc(db, 'studyGroups', groupId), {
    upcomingSessions: arrayUnion(item),
    updatedAt: serverTimestamp(),
  });
}
