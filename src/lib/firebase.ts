// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDn89DTHUQjFWCV6J3wm1EMP3B-227qJSE",
  authDomain: "farm-fuzion-abdf3.firebaseapp.com",
  projectId: "farm-fuzion-abdf3",
  storageBucket: "farm-fuzion-abdf3.appspot.com", // ✅ FIXED!
  messagingSenderId: "602008321992",
  appId: "1:602008321992:web:27b433f1e69fbac6a8cafd",
  measurementId: "G-X0QZDW0MVE"
};

const firebaseApp = initializeApp(firebaseConfig); // 👈 THIS IS THE FIX!
export const storage = getStorage(firebaseApp);
