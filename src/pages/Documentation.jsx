import React from 'react';

const Documentation = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border mt-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Project Documentation</h1>
      <div className="space-y-6 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-blue-600">Overview</h2>
          <p>ระบบจัดการภารกิจทีม (Team Task Manager) ออกแบบมาเพื่อเพิ่มประสิทธิภาพการทำงานกลุ่ม โดยใช้ React, Tailwind CSS และ Firebase Firestore ในการประสานงานแบบ Real-time</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-blue-600">Key Features</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>Team Filtering:</strong> กรองงานรายสมาชิก เพื่อความชัดเจนในภาระงาน</li>
            <li><strong>Productivity Insights:</strong> รายงานความคืบหน้าแบบ Real-time</li>
            <li><strong>Priority System:</strong> จัดลำดับความสำคัญของงานด้วยสี (High/Medium/Low)</li>
            <li><strong>Daily Logs:</strong> บันทึกความเคลื่อนไหวประจำวันของทีม</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-blue-600">Tech Stack</h2>
          <p>Frontend: React (Vite), Tailwind CSS (v4), React Router, Context API</p>
          <p>Backend: Firebase Firestore (Real-time DB)</p>
        </section>
      </div>
    </div>
  );
};

export default Documentation;