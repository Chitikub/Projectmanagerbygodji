import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, doc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const DailyLog = () => {
  const { user, userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);

  // ดึงข้อมูล "งานทั้งหมด" จากตาราง tasks เพื่อคำนวณ Progress ของทั้งทีม
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // คำนวณ Progress ความคืบหน้าของโปรเจกต์
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'เสร็จสิ้น').length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // แยกหมวดหมู่งาน: งานของฉัน vs งานของคนอื่น
  const myRole = userProfile?.role || '';
  const myTasks = tasks.filter(task => task.assignedRole === myRole);
  const teamTasks = tasks.filter(task => task.assignedRole !== myRole);

  // ฟังก์ชันสลับสถานะงาน (ติ๊กเช็คลิสต์)
  const handleToggleTask = async (task) => {
    // กำหนดสถานะใหม่: ถ้าเสร็จแล้วให้กลับไป 'กำลังทำ' ถ้ายังไม่เสร็จให้เป็น 'เสร็จสิ้น'
    const newStatus = task.status === 'เสร็จสิ้น' ? 'กำลังทำ' : 'เสร็จสิ้น';
    
    try {
      await updateDoc(doc(db, 'tasks', task.id), { 
        status: newStatus 
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 pb-20">
      
      {/* ส่วน Header และแถบ Progress */}
      <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">ภาพรวมความคืบหน้าทีม</h2>
        <p className="text-sm text-slate-500 mb-6">ติดตามงานรายวันและอัปเดตสถานะงานของคุณที่นี่</p>
        
        <div className="mb-2 flex justify-between items-end">
          <span className="text-sm font-semibold text-slate-700">Project Progress</span>
          <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
        </div>
        
        {/* Progress Bar Background */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
          {/* Progress Bar Fill with Animation */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-400 font-medium">
          <span>{completedTasks} งานเสร็จสิ้น</span>
          <span>ทั้งหมด {totalTasks} งาน</span>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* คอลัมน์ 1: เช็คลิสต์งานของฉัน */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            งานของฉัน ({myTasks.length})
          </h3>
          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white p-4 rounded-2xl border border-dashed border-slate-200">คุณยังไม่มีงานที่ได้รับมอบหมาย</p>
            ) : (
              myTasks.map(task => {
                const isDone = task.status === 'เสร็จสิ้น';
                return (
                  <label 
                    key={task.id} 
                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                      isDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                    }`}
                  >
                    <div className="mt-1 relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={isDone}
                        onChange={() => handleToggleTask(task)}
                        className="peer w-5 h-5 cursor-pointer appearance-none rounded border-2 border-slate-300 checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                      />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className={`font-semibold text-sm transition-all ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      {task.deadline && (
                        <p className={`text-xs mt-1 ${isDone ? 'text-slate-400' : 'text-amber-600 font-medium'}`}>
                          กำหนดส่ง: {task.deadline}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </section>

        {/* คอลัมน์ 2: งานของเพื่อนร่วมทีม */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
            ความคืบหน้าของทีม ({teamTasks.length})
          </h3>
          <div className="space-y-3 opacity-80">
            {teamTasks.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white p-4 rounded-2xl border border-dashed border-slate-200">ยังไม่มีงานของทีม</p>
            ) : (
              teamTasks.map(task => {
                const isDone = task.status === 'เสร็จสิ้น';
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
                    {isDone ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {task.assignedRole}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

    </div>
  );
};

export default DailyLog;