
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ก๊อปปี้ค่าจาก Firebase Console มาใส่ตรงนี้ให้ครบนะครับ
  apiKey: "AIzaSyA0BDNVGWx5C-h_98ugWAmBN_0BwLRwvow",
  authDomain: "projectmanagerbygodji.firebaseapp.com",
  projectId: "projectmanagerbygodji",
  storageBucket: "projectmanagerbygodji.firebasestorage.app",
  messagingSenderId: "38500190209",
  appId: "1:38500190209:web:2f7979c9d6c16d4ccd9800"
};

const app = initializeApp(firebaseConfig);

// ตัวนี้คือตัวที่เราต้องใช้ ต้องมีคำว่า export นำหน้า!
export const auth = getAuth(app);
export const db = getFirestore(app);
