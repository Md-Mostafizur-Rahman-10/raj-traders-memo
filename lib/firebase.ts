import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCvsGf7eDyAQfozoya5JTfjlpBz27YQa9c",

  authDomain: "raj-traders-10338.firebaseapp.com",

  projectId: "raj-traders-10338",

  storageBucket: "raj-traders-10338.firebasestorage.app",

  messagingSenderId: "749164825477",

  appId: "1:749164825477:web:a54cb5d6cc4086d97052ec"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
})
