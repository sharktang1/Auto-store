// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmyV6hca0aBariuywNiVMVeoaSZ8U6p68",
  authDomain: "auto-store-b3730.firebaseapp.com",
  projectId: "auto-store-b3730",
  storageBucket: "auto-store-b3730.firebasestorage.app",
  messagingSenderId: "929143550068",
  appId: "1:929143550068:web:472b9970843d27c901e121",
  measurementId: "G-KVTEPFL64G"
      
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


