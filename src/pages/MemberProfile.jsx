import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const MemberProfile = () => {
  const { id } = useParams(); // รับค่า ID ของ User
  const location = useLocation();
  const navigate = useNavigate();
  
  // สร้าง State สำหรับเก็บข้อมูล Member (รับค่าเริ่มต้นจากหน้า Dashboard ก่อนเพื่อให้โหลดไว)
  const [member, setMember] = useState(location.state?.member || {});
  const [tasks, setTasks] = useState([]);

  // 1. อัปเดตข้อมูล Profile แบบ Real-time (ถ้ารูปหรือชื่อเปลี่ยน จะเด้งเปลี่ยนตามทันที)
  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', id), (docSnap) => {
      if (docSnap.exists()) {
        // อัปเดตข้อมูลใหม่ล่าสุดจากฐานข้อมูล
        setMember(prev => ({ ...prev, ...docSnap.data(), id: docSnap.id }));
      }
    });
    return () => unsubscribe();
  }, [id]);

  // 2. ดึงงานที่ User คนนี้รับผิดชอบ หรือ เป็นคนสร้าง
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const userTasks = allTasks.filter(t => 
        (member.role && t.assignedRole === member.role) || 
        t.createdByUid === id
      );
      setTasks(userTasks);
    });

    return () => unsubscribe();
  }, [id, member.role]);

  // สถิติส่วนตัว
  const totalTasks = tasks.length;
  const approvedTasks = tasks.filter(t => t.approved).length;
  const pendingTasks = totalTasks - approvedTasks;

  // ค้นหาไฟล์หรือเอกสารที่เขาเคยแนบ
  const uploadedFiles = tasks.filter(t => t.fileUrl || t.externalLink);

  // ดึงชื่อ รูป และ ตำแหน่ง
  const fallbackName = member.displayName || member.name || member.email?.split('@')[0] || 'Unknown User';
  const photo = member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
  const roleName = member.role || 'ไม่ได้ระบุตำแหน่ง';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20 w-full"
    >
      <button onClick={() => navigate(-1)} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 transition">
        ← กลับไปหน้า Dashboard
      </button>

      {/* Header Profile */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        
        {/* รูปโปรไฟล์ */}
        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${member.frame || 'border-slate-200'} shadow-lg flex-shrink-0 bg-slate-100`}>
          <img 
            src={photo} 
            alt={fallbackName} 
            className="w-full h-full object-cover" 
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`; 
            }}
          />
        </div>

        <div className="flex-1">
          {/* จัดเรียง ชื่อ และ ตำแหน่ง ให้อยู่บรรทัดเดียวกัน (ย้ายไปข้างหลังชื่อ) */}
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <h1 className="text-3xl font-bold text-slate-800">{fallbackName}</h1>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
              {roleName}
            </span>
            {member.title && (
              <span className="text-sm text-slate-500 font-medium">({member.title})</span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mt-5 justify-center md:justify-start">
            <div className="bg-slate-50 px-4 py-2 rounded-xl text-center border shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Points</p>
              <p className="text-lg font-black text-amber-500">{member.points || 0}</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl text-center border shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Tasks</p>
              <p className="text-lg font-black text-slate-700">{totalTasks}</p>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-100 shadow-sm">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Completed</p>
              <p className="text-lg font-black text-emerald-600">{approvedTasks}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* รายการงานค้าง */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            🚧 งานที่กำลังรับผิดชอบ
          </h2>
          <div className="space-y-3">
            {pendingTasks === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed">ไม่มีงานค้าง</p>
            ) : (
              tasks.filter(t => !t.approved).map(task => (
                <div key={task.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition bg-slate-50/50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm text-slate-800">{task.title}</h3>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">{task.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{task.description}</p>
                  {task.deadline && (
                    <p className="text-[10px] text-amber-600 mt-2 font-medium">กำหนดส่ง: {task.deadline}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ไฟล์ที่อัปโหลดไว้ */}
        <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            📁 ไฟล์และเอกสาร
          </h2>
          <div className="space-y-3">
            {uploadedFiles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed">ยังไม่เคยอัปโหลดไฟล์</p>
            ) : (
              uploadedFiles.map(task => (
                <div key={task.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2 hover:border-indigo-200 transition">
                  <p className="text-xs font-semibold text-slate-700 truncate">{task.title}</p>
                  <div className="flex gap-2">
                    {task.fileUrl && (
                      <a href={task.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-white bg-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition shadow-sm">
                        โหลดไฟล์
                      </a>
                    )}
                    {task.externalLink && (
                      <a href={task.externalLink.startsWith('http') ? task.externalLink : `https://${task.externalLink}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition shadow-sm">
                        เปิดลิงก์
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default MemberProfile;