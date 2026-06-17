import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext'; 
import { AuthProvider, useAuth } from './context/AuthContext'; // import useAuth มาด้วย
import AppRoutes from './router/AppRoutes';
import Login from './pages/login'; 

// สร้าง Component ย่อยเพื่อจัดการเรื่อง Router จะได้ใช้ useAuth() ได้
const MainContent = () => {
  const { user, loading } = useAuth(); // ดึง user และ loading มาจาก AuthContext

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      {user ? <AppRoutes /> : <Login />}
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainContent />
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;