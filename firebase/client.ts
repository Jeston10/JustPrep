// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCPtDlpjjFxPkiLkpPR6pWZw2a8IS2N_lU",
  authDomain: "justprep-12b9c.firebaseapp.com",
  projectId: "justprep-12b9c",
  storageBucket: "justprep-12b9c.firebasestorage.app",
  messagingSenderId: "349545385169",
  appId: "1:349545385169:web:02eb4cc9df5b8538a0c9f0",
  measurementId: "G-9JPBH1JN89"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);