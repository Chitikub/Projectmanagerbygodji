import React, { useState, useEffect } from 'react';
import { auth } from "./firebase";
import { onAuthStateChanged } from 'firebase/auth';
import Login from './pages/login'

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {user ? (
        <div className="p-10 text-white">ยินดีต้อนรับสู่ Dashboard!</div>
      ) : (
        <Login />
      )}
    </>
  );
}

export default App;