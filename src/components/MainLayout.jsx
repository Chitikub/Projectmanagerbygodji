import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import ProfileBadge from './ProfileBadge';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import MySwal, { toast } from '../utils/swal';


const MainLayout = () => {
  const { user } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/project-manager', label: 'Manager' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/logs', label: 'Logs' }, 
    { path: '/documentation', label: 'Docs' },
  ];

  const handleLogout = async () => {
    try {
      const result = await MySwal.fire({
        title: 'ออกจากระบบ?',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
      })

      if (result.isConfirmed) {
        await signOut(auth);
        toast('ออกจากระบบเรียบร้อย', 'success');
      }
    } catch (error) {
      console.error("Logout Error:", error);
      toast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
  };

  const location = useLocation();

  React.useEffect(() => {
    const mapPathToName = (path) => {
      const map = {
        '/': 'Dashboard',
        '/project-manager': 'Project Manager',
        '/tasks': 'Tasks',
        '/logs': 'Daily Log',
        '/documentation': 'Documentation',
        '/profile': 'Profile Settings'
      };
      return map[path] || path;
    };

    const name = mapPathToName(location.pathname);
    toast(`Opened ${name}`, 'info');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white p-4 flex justify-between items-center px-8 border-b border-slate-100 sticky top-0 z-50">
        <div className="flex gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative px-4 py-2 rounded-xl transition-colors duration-300 ${
                  isActive ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-slate-100 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ProfileBadge />
          <button 
            onClick={handleLogout} 
            className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>
      
      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet /> 
      </main>
    </div>
  );
};

export default MainLayout;