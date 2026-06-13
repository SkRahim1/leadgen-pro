import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Log warning in development if environment variables are missing
if (
  process.env.NODE_ENV === "development" &&
  (!firebaseConfig.apiKey || !firebaseConfig.projectId)
) {
  console.warn(
    "[Firebase Config] Missing Firebase environment configuration variables. " +
    "Please check your .env.local file."
  )
}

// Initialize Firebase (Singleton pattern to prevent re-initialization during HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

export { app, auth }
