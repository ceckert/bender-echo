import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCk-b7hqiGPogqWYgOFSLefDxCIl4WQ0oU",
  authDomain: "bender-echo.firebaseapp.com",
  projectId: "bender-echo",
  storageBucket: "bender-echo.firebasestorage.app",
  messagingSenderId: "492711855104",
  appId: "1:492711855104:web:29311d7dd0ef3f773484e5",
  measurementId: "G-XFMF2RB7VL"
};

function getFirebaseApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

// Lazy getters — only initialize when accessed on the client side
export const getFirebaseAuth = () => getAuth(getFirebaseApp());
export const getFirebaseDb = () => getFirestore(getFirebaseApp());
export const getGoogleProvider = () => new GoogleAuthProvider();
export const getGithubProvider = () => new GithubAuthProvider();
