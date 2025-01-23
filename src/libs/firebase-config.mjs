// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf3zs3cJUkQFfoZdmXjxUTzuLnEixv_xY",
  authDomain: "ranivour.firebaseapp.com",
  projectId: "ranivour",
  storageBucket: "ranivour.firebasestorage.app",
  messagingSenderId: "950645609036",
  appId: "1:950645609036:web:4dad4bfc12141ecfc51ae9",
  measurementId: "G-QC5DJFBDLH"
      
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export { app, storage, db, auth, messaging };


