import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  applyActionCode,
  checkActionCode,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDSvFQUWq-4rPGYH86Xw6R57KMYUlSYAPE",
  authDomain: "quikden-2b6bb.firebaseapp.com",
  projectId: "quikden-2b6bb",
  storageBucket: "quikden-2b6bb.firebasestorage.app",
  messagingSenderId: "394728970344",
  appId: "1:394728970344:web:ddf7f752d59a8c1ecbc3dd",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  applyActionCode,
  checkActionCode,
};
