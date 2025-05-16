import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const db = getFirestore(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error enabling persistence:", error);
  });

export const analytics = getAnalytics(app);

// Helper function to get current user's document reference
export const getUserDoc = async (userId) => {
  if (!userId) return null;
  return doc(db, 'users', userId);
};

// Helper function to create or update user data
export const updateUserData = async (userId, data) => {
  if (!userId) return null;
  const userRef = await getUserDoc(userId);
  await setDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
  return userRef;
};

// Notes related functions
export const createNote = async (userId, noteData) => {
  if (!userId) return null;
  
  const noteRef = doc(collection(db, 'notes'));
  const newNote = {
    ...noteData,
    id: noteRef.id,
    user_id: userId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    exported: false,
    tags: noteData.tags || []
  };
  
  await setDoc(noteRef, newNote);
  return newNote;
};

export const updateNote = async (noteId, updates) => {
  if (!noteId) return null;
  
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    ...updates,
    updated_at: serverTimestamp()
  });
  
  const updatedNote = await getDoc(noteRef);
  return { id: updatedNote.id, ...updatedNote.data() };
};

export const deleteNote = async (noteId) => {
  if (!noteId) return null;
  
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
  return true;
};

export const getUserNotes = async (userId) => {
  if (!userId) return [];
  
  const notesRef = collection(db, 'notes');
  const q = query(notesRef, where('user_id', '==', userId), orderBy('created_at', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Convert Firestore timestamps to Date objects
    created_at: doc.data().created_at?.toDate(),
    updated_at: doc.data().updated_at?.toDate()
  }));
};

export const getNoteById = async (noteId) => {
  if (!noteId) return null;
  
  const noteRef = doc(db, 'notes', noteId);
  const noteDoc = await getDoc(noteRef);
  
  if (!noteDoc.exists()) return null;
  
  return {
    id: noteDoc.id,
    ...noteDoc.data(),
    created_at: noteDoc.data().created_at?.toDate(),
    updated_at: noteDoc.data().updated_at?.toDate()
  };
};

export default app;