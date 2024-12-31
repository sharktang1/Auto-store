// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);