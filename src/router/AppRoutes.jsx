import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import DailyLog from '../pages/DailyLog';
import MainLayout from '../components/MainLayout';
import Documentation from '../pages/Documentation';
import ProfileSettings from '../pages/ProfileSettings';
import ProjectManager from '../pages/ProjectManager';
import Tasks from '../pages/Tasks';
import MemberProfile from '../pages/MemberProfile';


const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/logs" element={<DailyLog />} />
        <Route path="/documentation" element={<Documentation />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/project-manager" element={<ProjectManager />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/member/:id" element={<MemberProfile />} />
      </Route>
      {/* ถ้าอนาคตมีหน้า Login เราแค่เพิ่มนอก Route นี้ มันก็จะไม่มี Navbar ครับ */}
    </Routes>
  );
};

export default AppRoutes;