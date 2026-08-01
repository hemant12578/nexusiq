import { initializeApp } from "firebase/app"
import { getAnalytics, isSupported } from "firebase/analytics"
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyApU_ma4iWxUfX1Dl8L7-dG03J2BdaUn6U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nexusiq-3e622.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nexusiq-3e622",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nexusiq-3e622.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "171642791773",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:171642791773:web:2203c4bafa803f2c582ab4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LB1L20XYWG"
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig)

// Analytics (safely checked for browser environment support)
let analytics = null
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

// Auth instance
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

export {
  app,
  analytics,
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
}
