import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDTdA43Hy_xIAorkXDwGPkm_yR8NKcks20",
  authDomain: "campus-lost-and-found-70a12.firebaseapp.com",
  projectId: "campus-lost-and-found-70a12",
  storageBucket: "campus-lost-and-found-70a12.firebasestorage.app",
  messagingSenderId: "673249523263",
  appId: "1:673249523263:web:3453c450cb9279617aea8a",
  measurementId: "G-SDG79LJ1T4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();