import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { supabase } from '../supabaseClient';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const roles = ['Frontend Developer', 'Backend Developer', 'QA (Frontend/Backend)', 'Project Lead'];
const taskStatuses = ['รอดำเนินการ', 'กำลังทำ', 'เสร็จสิ้น'];
const rewardPoints = 10;

// --- Component ปฏิทิน ---
const MiniCalendar = ({ tasks, milestones }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const getDayMarkers = (day) => {
    let taskColors = new Set();
    let hasMilestone = false;

    tasks.forEach(t => {
      if (!t.deadline) return;
      const d = new Date(t.deadline);
      if (d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.status === 'เสร็จสิ้น') taskColors.add('bg-emerald-500');
        else if (t.status === 'กำลังทำ') taskColors.add('bg-amber-400');
        else taskColors.add('bg-rose-500');
      }
    });

    milestones.forEach(m => {
      if (!m.dueDate) return;
      const d = new Date(m.dueDate);
      if (d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear) hasMilestone = true;
    });

    return { taskColors: Array.from(taskColors), hasMilestone };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{monthNames[currentMonth]} {currentYear + 543}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition">{"<"}</button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition">{">"}</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map(day => <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {blanks.map(blank => <div key={`blank-${blank}`} className="p-2"></div>)}
        {days.map(day => {
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const { taskColors, hasMilestone } = getDayMarkers(day);

          return (
            <div key={day} className="flex flex-col items-center justify-center h-10 relative">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'}`}>
                {day}
              </div>
              <div className="absolute bottom-0 flex gap-1 justify-center w-full">
                {taskColors.map((color, index) => (
                  <div key={index} className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
                ))}
                {hasMilestone && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500 justify-center">
        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> รอดำเนินการ</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-full"></div> กำลังทำ</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> เสร็จสิ้น</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> เหตุการณ์สำคัญ</span>
      </div>
    </div>
  );
};


const Tasks = () => {
  const { user, userProfile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedRole, setAssignedRole] = useState(userProfile?.role || 'Frontend Developer');
  const [deadline, setDeadline] = useState('');
  const [externalLink, setExternalLink] = useState(''); // เก็บลิงก์
  const [fileUrl, setFileUrl] = useState(''); // เก็บ URL ไฟล์อัปโหลด
  const [status, setStatus] = useState('รอดำเนินการ');
  const [editingTask, setEditingTask] = useState(null);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  const role = userProfile?.role || '';
  const canModifyGlobal = role === 'Project Lead';
  const assignedRoleOptions = role === 'Project Lead' ? roles : [role];

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      // ดึงมาทั้งหมด
      const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // กรองเอาเฉพาะงานที่ยังไม่ผ่านการ approved
      const activeTasks = allTasks.filter(task => !task.approved);
      setTasks(activeTasks);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'milestones'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snapshot) => setMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
  }, []);

  useEffect(() => {
    if (role && !assignedRoleOptions.includes(assignedRole)) setAssignedRole(role);
  }, [role, assignedRole, assignedRoleOptions]);

  // ระบบอัปโหลดไฟล์
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
        
      setFileUrl(publicUrlData.publicUrl);
      alert('อัปโหลดไฟล์สำเร็จ!');
    } catch (error) {
      console.error("Upload Error:", error);
      alert("ไม่สามารถอัปโหลดไฟล์ได้: โปรดตรวจสอบว่าสร้าง Bucket 'documents' ใน Supabase และตั้งเป็น Public หรือยัง");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setDeadline(''); setExternalLink(''); setFileUrl('');
    setStatus('รอดำเนินการ'); setAssignedRole(role || 'Frontend Developer'); setEditingTask(null);
  };

  const handleCreateOrUpdateTask = async () => {
    if (!title.trim()) return;
    const taskData = {
      title, description, assignedRole,
      assignedUid: user?.uid || '',
      createdBy: user?.displayName || 'สมาชิก',
      createdByUid: user?.uid || '',
      status, deadline, externalLink, fileUrl,
      submittedForReview: false, approved: false, pointsValue: rewardPoints,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingTask) {
        // อัปเดตงานที่มีอยู่
        await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
        alert('อัปเดตงานสำเร็จ!');
      } else {
        // สร้างงานใหม่
        await addDoc(collection(db, 'tasks'), { ...taskData, createdAt: serverTimestamp() });
        alert('สร้างงานสำเร็จ!');
      }
      resetForm(); // ล้างฟอร์มเมื่อเสร็จสิ้น
    } catch (error) {
      console.error("Error updating task: ", error);
      // หากเกิด Error (เช่น ไม่มี Document นี้แล้ว)
      alert("เกิดข้อผิดพลาด: งานนี้อาจถูกลบไปแล้ว โปรดรีเฟรชหน้าจอ");
      resetForm(); // ล้าง State ป้องกันการค้าง
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task); setTitle(task.title); setDescription(task.description || '');
    setAssignedRole(task.assignedRole || role); setDeadline(task.deadline || '');
    setExternalLink(task.externalLink || ''); setFileUrl(task.fileUrl || ''); setStatus(task.status || 'รอดำเนินการ');
  };

  const handleDeleteTask = async (task) => {
    if (window.confirm('ยืนยันการลบงานนี้?')) await deleteDoc(doc(db, 'tasks', task.id));
  };

  // ลบ Milestone (เฉพาะ Project Lead)
  const handleDeleteMilestone = async (milestoneId) => {
    if (window.confirm('ยืนยันการลบเหตุการณ์สำคัญนี้ออกจากปฏิทิน?')) {
      await deleteDoc(doc(db, 'milestones', milestoneId));
    }
  };

  const handleSubmitForReview = async (task) => {
    if (!task.id) return;
    await updateDoc(doc(db, 'tasks', task.id), { 
      status: 'เสร็จสิ้น',
      submittedForReview: true, 
      submittedAt: serverTimestamp() 
    });
  };

  const handleApproveTask = async (task) => {
    if (!task.id) return;
    await updateDoc(doc(db, 'tasks', task.id), { 
      status: 'เสร็จสิ้น',
      approved: true, 
      approvedAt: serverTimestamp(), 
      submittedForReview: false 
    });
    if (task.createdByUid) {
      await updateDoc(doc(db, 'users', task.createdByUid), { points: increment(task.pointsValue || rewardPoints) });
    }
  };

  return (
    <div className="space-y-10 pb-10 max-w-7xl mx-auto w-full">
      
      <section className="rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-500">Task Manager</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">จัดการงานและกระดานทีม</h1>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
            <p className="text-sm text-slate-500">สิทธิ์ของคุณ</p>
            <p className="text-xl font-semibold text-slate-900">{role || 'ยังไม่ได้กำหนดบทบาท'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        
        {/* คอลัมน์ซ้าย: สร้างงาน */}
        <div className="lg:col-span-1 rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 h-fit sticky top-24">
          <h2 className="text-lg font-semibold text-slate-900">{editingTask ? 'แก้ไขงาน' : 'สร้างงานใหม่'}</h2>
          {!role ? (
            <p className="mt-3 text-sm text-slate-500">กรุณาตั้งค่าโปรไฟล์ก่อนสร้างงาน</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none" placeholder="ชื่องาน..." />
              </div>
              <div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none resize-none" rows={3} placeholder="รายละเอียด..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={assignedRole} onChange={(e) => setAssignedRole(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none">
                  {assignedRoleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none" />
              </div>
              <div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none">
                  {taskStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* ช่องใส่ลิงก์อ้างอิง */}
              <div>
                <input 
                  value={externalLink} 
                  onChange={(e) => setExternalLink(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none" 
                  placeholder="https:// ลิงก์แนบ (ถ้ามี)" 
                />
              </div>

              {/* Drag & Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />
                {uploadingFile ? (
                  <p className="text-xs font-bold text-indigo-500 animate-pulse">กำลังอัปโหลด...</p>
                ) : fileUrl ? (
                  <p className="text-xs font-bold text-emerald-600">แนบไฟล์แล้ว (คลิกเพื่อเปลี่ยน)</p>
                ) : (
                  <p className="text-xs text-slate-500">ลากไฟล์มาวางที่นี่ หรือ <span className="text-indigo-500 font-bold">คลิกอัปโหลด</span></p>
                )}
              </div>
              
              <div className="pt-2">
                <button onClick={handleCreateOrUpdateTask} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                  {editingTask ? 'อัปเดตงาน' : 'สร้างงาน'}
                </button>
                {editingTask && <button onClick={resetForm} className="w-full mt-2 text-xs text-slate-500 hover:text-slate-700">ยกเลิกการแก้ไข</button>}
              </div>
            </div>
          )}
        </div>

        {/* คอลัมน์กลาง: บอร์ดงาน */}
        <div className="lg:col-span-2 rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">รายการงานทีม</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{tasks.length} งาน</span>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => {
              const isMyTask = task.assignedRole === role;
              const canModify = canModifyGlobal || isMyTask;
              
              let statusColor = "bg-slate-100 text-slate-500";
              if (task.status === "เสร็จสิ้น") statusColor = "bg-emerald-100 text-emerald-700";
              if (task.status === "กำลังทำ") statusColor = "bg-amber-100 text-amber-700";
              if (task.status === "รอดำเนินการ") statusColor = "bg-rose-100 text-rose-700";

              return (
                <div key={task.id} className={`rounded-2xl border ${task.approved ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white'} p-5 hover:shadow-md transition`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      {task.title}
                      {task.approved && <span className="text-emerald-500 text-xs">✓ อนุมัติแล้ว</span>}
                    </h3>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusColor}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{task.description}</p>
                  
                  {/* แสดง Badge ข้อมูลต่างๆ ของงาน */}
                  <div className="flex flex-wrap gap-2 text-[10px] mb-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">ฝ่าย: {task.assignedRole}</span>
                    {task.deadline && <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-200">ส่ง: {task.deadline}</span>}
                    
                    {/* แสดงลิงก์อ้างอิง ถ้ามี */}
                    {task.externalLink && (
                      <a href={task.externalLink.startsWith('http') ? task.externalLink : `https://${task.externalLink}`} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 hover:underline">
                        🔗 เปิดลิงก์อ้างอิง
                      </a>
                    )}
                    
                    {/* แสดงปุ่มโหลดไฟล์ ถ้ามี */}
                    {task.fileUrl && (
                      <a href={task.fileUrl} target="_blank" rel="noreferrer" className="bg-sky-50 text-sky-700 px-2 py-1 rounded-md border border-sky-100 hover:underline">
                        📄 โหลดไฟล์แนบ
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {task.status === 'เสร็จสิ้น' && isMyTask && !task.submittedForReview && !task.approved && (
                      <button onClick={() => handleSubmitForReview(task)} className="bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition">
                        ส่งให้ Project Lead ตรวจ
                      </button>
                    )}

                    {canModifyGlobal && task.status === 'เสร็จสิ้น' && !task.approved && (
                      <button 
                        onClick={() => handleApproveTask(task)} 
                        className="bg-emerald-500 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm hover:bg-emerald-400 transition flex items-center gap-1"
                      >
                        ✓ อนุมัติงาน
                      </button>
                    )}

                    {canModify && (
                      <>
                        <button onClick={() => handleEditTask(task)} className="border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition">แก้ไข</button>
                        <button onClick={() => handleDeleteTask(task)} className="border border-red-100 bg-red-50 px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-100 transition">ลบ</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* คอลัมน์ขวา: ปฏิทินและ Milestone */}
        <div className="lg:col-span-1 space-y-6">
          <MiniCalendar tasks={tasks} milestones={milestones} />

          <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase mb-4">📍 เหตุการณ์สำคัญ</h2>
            
            <div className="space-y-3 mb-6">
              {milestones.length === 0 ? <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed">ไม่มีกำหนดการสำคัญ</p> : 
                milestones.map(m => (
                  <div key={m.id} className="p-3 bg-purple-50 rounded-xl border border-purple-100 relative group flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-purple-900">{m.name}</p>
                      <p className="text-[10px] text-purple-600 mt-1">วันที่: {m.dueDate}</p>
                    </div>
                    {/* ปุ่มลบ Milestone เฉพาะ Project Lead */}
                    {canModifyGlobal && (
                      <button 
                        onClick={() => handleDeleteMilestone(m.id)} 
                        className="opacity-0 group-hover:opacity-100 text-purple-300 hover:text-red-500 transition-opacity p-1"
                        title="ลบเหตุการณ์นี้"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))
              }
            </div>

            {canModifyGlobal && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold mb-2 text-slate-700">เพิ่มเหตุการณ์ลงปฏิทิน</p>
                <input value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} placeholder="ชื่องาน..." className="w-full mb-2 p-2 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50" />
                <input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} className="w-full mb-3 p-2 text-xs rounded-xl border border-slate-200 outline-none bg-slate-50" />
                <button onClick={async () => {
                  if (!milestoneName || !milestoneDate) return;
                  await addDoc(collection(db, 'milestones'), { name: milestoneName, dueDate: milestoneDate, createdAt: serverTimestamp() });
                  setMilestoneName(''); setMilestoneDate('');
                }} className="w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-purple-500 transition shadow-sm">
                  เพิ่มกำหนดการ
                </button>
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Tasks;