// farm-fuzion-frontend/src/components/firebase.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// ✅ Use the config provided by Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDn89DTHUQjFWCV6J3wm1EMP3B-227qJSE",
  authDomain: "farm-fuzion-abdf3.firebaseapp.com",
  projectId: "farm-fuzion-abdf3",
  storageBucket: "farm-fuzion-abdf3.appspot.com", // ✅ FIXED: use .appspot.com not .firebasestorage.app
  messagingSenderId: "602008321992",
  appId: "1:602008321992:web:27b433f1e69fbac6a8cafd",
  measurementId: "G-X0QZDW0MVE"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
