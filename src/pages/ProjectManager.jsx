import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const ProjectManager = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'ผู้ใช้งาน';
  const role = userProfile?.role || 'Frontend Developer';
  const title = userProfile?.title || role;
  const frameClass = userProfile?.frame || 'border-indigo-500';
  const isProjectLead = role === 'Project Lead';

  // ดึงงานทั้งหมดจาก Database
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // ฟังก์ชันลบงาน (ทำได้เฉพาะหน้านี้ และเฉพาะ Project Lead)
  const handleDeleteTask = async (taskId) => {
    if (!isProjectLead) {
      alert("เฉพาะ Project Lead เท่านั้นที่สามารถลบงานออกจากระบบได้");
      return;
    }
    if (window.confirm('⚠️ ยืนยันการลบงานนี้ออกจากระบบอย่างถาวร?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
    }
  };

  const roles = ['Frontend Developer', 'Backend Developer', 'QA (Frontend/Backend)', 'Project Lead'];

  // --- คำนวณสถิติเฉพาะของแผนก (หรือทั้งหมดถ้าเป็น Project Lead) ---
  const relevantTasks = isProjectLead ? tasks : tasks.filter(t => t.assignedRole === role);
  
  const totalTasks = relevantTasks.length;
  const approvedTasks = relevantTasks.filter(t => t.approved).length;
  const pendingTasks = totalTasks - approvedTasks;

  const summaryCards = [
    { title: `งานทั้งหมดของ ${isProjectLead ? 'ทุกแผนก' : role}`, value: totalTasks, description: 'งานทั้งหมดตั้งแต่เริ่มโปรเจกต์' },
    { title: 'งานที่อนุมัติแล้ว', value: approvedTasks, description: 'เสร็จสิ้นและถูกจัดเก็บแล้ว', color: 'text-emerald-400' },
    { title: 'งานที่รอ/กำลังทำ', value: pendingTasks, description: 'อยู่ระหว่างดำเนินการโดยทีม', color: 'text-amber-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10 pb-10 max-w-7xl mx-auto w-full p-4 md:p-8"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.22),transparent_30%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] items-center">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Manager Workspace</p>
            <h1 className="text-4xl font-bold tracking-tight">ศูนย์ควบคุมและสรุปผลโปรเจกต์</h1>
            <p className="max-w-2xl text-slate-300">
              ติดตามความคืบหน้า จัดการงานที่อนุมัติแล้ว และดูภาพรวมการทำงานของ{isProjectLead ? 'ทีมทั้งหมด' : `แผนก ${role}`}
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => navigate('/tasks')}
                className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400"
              >
                ไปที่กระดานงานทีม (Task Board)
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
            <div className={`inline-flex items-center gap-3 rounded-3xl border-2 ${frameClass} bg-slate-900/90 p-4 shadow-lg shadow-slate-950/40`}>
              <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-slate-800">
                <img
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=222328&color=ffffff`}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">{displayName}</p>
                <p className="text-lg font-semibold text-white">{title}</p>
              </div>
            </div>
            
            <div className="mt-6 grid gap-3">
              {summaryCards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-slate-900/80 px-5 py-4 transition-colors hover:bg-slate-800/80">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.color || 'text-white'}`}>{card.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Department Progress & Task Management */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 px-2">สรุปความคืบหน้าแยกตามแผนก (Department Progress)</h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {roles.map((r) => {
            // กรองงานเฉพาะของแผนกนั้นๆ
            const roleTasks = tasks.filter(t => t.assignedRole === r);
            const roleTotal = roleTasks.length;
            // นับงานที่เสร็จแล้ว (อนุมัติแล้ว หรือ สถานะเสร็จสิ้น)
            const roleCompleted = roleTasks.filter(t => t.approved || t.status === 'เสร็จสิ้น').length;
            const roleProgress = roleTotal === 0 ? 0 : Math.round((roleCompleted / roleTotal) * 100);

            return (
              <div key={r} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Header ของแต่ละแผนก */}
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{r}</h3>
                    <span className="text-2xl font-black text-indigo-600">{roleProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-2">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${roleProgress}%` }} 
                      transition={{ duration: 1 }} 
                      className={`h-full rounded-full ${roleProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">ทำเสร็จ {roleCompleted} จาก {roleTotal} งาน</p>
                </div>

                {/* รายการงานของแผนกนั้นๆ */}
                <div className="p-6 flex-1 overflow-y-auto max-h-[350px] space-y-3 bg-white">
                  {roleTasks.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4 border border-dashed rounded-xl">ยังไม่มีงานในแผนกนี้</p>
                  ) : (
                    roleTasks.map(task => (
                      <div key={task.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${task.approved ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 hover:border-indigo-200'}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 truncate text-sm">{task.title}</h4>
                            {task.approved && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">อนุมัติแล้ว</span>}
                            {!task.approved && task.status === 'เสร็จสิ้น' && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">รอตรวจ</span>}
                          </div>
                          <p className="text-[10px] text-slate-500">สร้างโดย: {task.createdBy} | สถานะ: {task.status}</p>
                        </div>
                        
                        {/* ปุ่มลบงาน (เฉพาะ Project Lead เท่านั้นที่เห็นปุ่มนี้) */}
                        {isProjectLead && (
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0"
                          >
                            ลบงาน
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </section>

    </motion.div>
  );
};

export default ProjectManager;