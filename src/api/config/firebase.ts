// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where, or, and,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  addDoc,
  runTransaction
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDao535Lcoc4eFZJWn_sgL04Ucfah5hh3c",
  authDomain: "wetalk12.firebaseapp.com",
  projectId: "wetalk12",
  storageBucket: "wetalk12.firebasestorage.app",
  messagingSenderId: "345454837017",
  appId: "1:345454837017:web:b23e6de201de196bf9d988",
  measurementId: "G-WZ9MB6KGXW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Initialize Firestore with long polling fallback if WebSockets are blocked in iframe
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();


export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where, or, and,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  addDoc,
  runTransaction,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};