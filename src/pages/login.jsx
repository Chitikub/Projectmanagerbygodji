import React, { useState } from 'react';
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // เช็คว่ามี Document ของ User อยู่ไหม ถ้าไม่มีให้สร้าง (ป้องกัน Error)
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      const userData = {
        isOnline: true,
        email,
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || ''
      };
      
      if (userSnap.exists()) {
        const updateFields = { isOnline: true };
        if (userCredential.user.displayName) updateFields.displayName = userCredential.user.displayName;
        if (userCredential.user.photoURL) updateFields.photoURL = userCredential.user.photoURL;
        await updateDoc(userRef, updateFields);
      } else {
        await setDoc(userRef, userData);
      }
      
    } catch (error) {
      alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-3xl border border-stone-100 shadow-sm w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Welcome Back</h1>
        <p className="text-stone-400 text-sm mb-8">Please enter your details to continue.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:border-indigo-300 transition" 
            placeholder="Email" 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl outline-none focus:border-indigo-300 transition" 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            className="w-full bg-indigo-500 text-white py-4 rounded-2xl font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-100"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
export default Login;