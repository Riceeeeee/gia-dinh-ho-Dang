// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBxbe1OsZyREEYs7gGEL7g4JDbxSu3k9S0",
  authDomain: "gia-dinh-ho-dang.firebaseapp.com",
  projectId: "gia-dinh-ho-dang",
  storageBucket: "gia-dinh-ho-dang.firebasestorage.app",
  messagingSenderId: "652491696942",
  appId: "1:652491696942:web:5e5123673876a9ae4de8bf",
  measurementId: "G-2VTHGWXMC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
