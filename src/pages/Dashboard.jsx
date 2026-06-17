import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// --- Component สำหรับประกาศ (ซ้าย) ---
const AnnouncementItem = ({ ann, canDelete }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { userProfile } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "announcements", ann.id, "comments"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [ann.id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const postComment = async () => {
    if (!newComment.trim()) return;
    const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Member";
    const authorPhotoURL = currentUser?.photoURL || `https://ui-avatars.com/?name=${encodeURIComponent(userName)}`;
    await addDoc(collection(db, "announcements", ann.id, "comments"), {
      author: userName,
      authorPhotoURL,
      authorFrame: userProfile?.frame || 'border-indigo-500',
      text: newComment,
      timestamp: serverTimestamp()
    });
    setNewComment('');
  };

  const handleDeleteAnnouncement = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?')) {
      await deleteDoc(doc(db, "announcements", ann.id));
    }
  };

  return (
    <div className="border border-slate-100 p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow relative group">
      {/* ปุ่มลบประกาศ เฉพาะ PM */}
      {canDelete && (
        <button 
          onClick={handleDeleteAnnouncement} 
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1"
          title="ลบประกาศนี้"
        >
          ✕
        </button>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${ann.authorFrame || 'border-indigo-500'} bg-slate-200 flex-shrink-0`}>
          <img src={ann.authorPhotoURL || `https://ui-avatars.com/?name=${encodeURIComponent(ann.author)}`} alt={ann.author} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">{ann.author}</p>
          <p className="text-[10px] text-slate-400">
            {ann.timestamp?.toDate ? ann.timestamp.toDate().toLocaleDateString('th-TH') : 'เพิ่งโพสต์'}
          </p>
        </div>
      </div>
      <p className="text-slate-700 mb-3 text-sm leading-relaxed">{ann.text}</p>
      
      <div className="space-y-2 mb-3">
        {comments.map(c => (
          <div key={c.id} className="bg-slate-50 px-3 py-2 rounded-xl text-xs">
            <span className="font-bold text-indigo-600 mr-2">{c.author}:</span>
            <span className="text-slate-600">{c.text}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input 
          className="flex-1 bg-slate-50 px-3 py-1.5 text-xs rounded-xl outline-none border border-slate-100 focus:border-indigo-300" 
          placeholder="ตอบกลับ..." 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && postComment()}
        />
      </div>
    </div>
  );
};

// --- Component ปฏิทินแบบมี Tooltip ---
const MiniCalendar = ({ tasks, milestones }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null); 
  
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

  const getDayDetails = (day) => {
    let dayTasks = [];
    let dayMilestones = [];
    let taskColors = new Set();

    tasks.forEach(t => {
      if (!t.deadline) return;
      const d = new Date(t.deadline);
      if (d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        dayTasks.push(t);
        if (t.status === 'เสร็จสิ้น') taskColors.add('bg-emerald-500');
        else if (t.status === 'กำลังทำ') taskColors.add('bg-amber-400');
        else taskColors.add('bg-rose-500');
      }
    });

    milestones?.forEach(m => {
      if (!m.dueDate) return;
      const d = new Date(m.dueDate);
      if (d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        dayMilestones.push(m);
      }
    });

    const updateMemberRole = async (uid, newRole) => {
  await updateDoc(doc(db, "users", uid), {
    role: newRole
  });
  alert("อัปเดตตำแหน่งเรียบร้อย!");
};

    return { 
      tasks: dayTasks, 
      milestones: dayMilestones, 
      taskColors: Array.from(taskColors), 
      hasMilestone: dayMilestones.length > 0 
    };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{monthNames[currentMonth]} {currentYear + 543}</h2>
          {currentMonth === today.getMonth() && currentYear === today.getFullYear() && (
            <p className="text-xs font-semibold text-indigo-500 mt-1">วันนี้: {today.getDate()} {monthNames[today.getMonth()]}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition">{"<"}</button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition">{">"}</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {blanks.map(blank => <div key={`blank-${blank}`} className="p-2"></div>)}
        
        {days.map(day => {
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const details = getDayDetails(day);
          const hasContent = details.tasks.length > 0 || details.milestones.length > 0;

          return (
            <div 
              key={day} 
              className="flex flex-col items-center justify-center h-10 relative"
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}>
                {day}
              </div>

              <div className="absolute bottom-0 flex gap-0.5 justify-center w-full">
                {details.taskColors.map((color, index) => (
                  <div key={index} className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
                ))}
                {details.hasMilestone && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>}
              </div>

              {hasContent && hoveredDay === day && (
                <div className="absolute bottom-full mb-2 w-48 bg-slate-800 text-white p-3 rounded-xl shadow-xl z-50 pointer-events-none transform -translate-x-1/2 left-1/2">
                  <p className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-600 pb-1 mb-2">
                    {day} {monthNames[currentMonth]}
                  </p>
                  
                  {details.milestones.map((m, i) => (
                    <div key={`m-${i}`} className="flex items-start gap-1 mb-1.5">
                      <span className="text-purple-400 text-[10px]">📍</span>
                      <p className="text-xs font-semibold">{m.name}</p>
                    </div>
                  ))}

                  {details.tasks.map((t, i) => {
                    let dotColor = "bg-rose-500";
                    if (t.status === 'เสร็จสิ้น') dotColor = "bg-emerald-500";
                    else if (t.status === 'กำลังทำ') dotColor = "bg-amber-400";
                    
                    return (
                      <div key={`t-${i}`} className="flex items-center gap-1.5 mb-1 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                        <span className="truncate">{t.title}</span>
                      </div>
                    );
                  })}
                  <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-800"></div>
                </div>
              )}
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

// --- Component หลัก Dashboard ---
function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [milestones, setMilestones] = useState([]); 
  const [annText, setAnnText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const { userProfile } = useAuth();
  const navigate = useNavigate(); // ประกาศใช้งาน navigate สำหรับย้ายหน้า

  const isProjectLead = userProfile?.role === 'Project Lead';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "tasks"), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      setTeamMembers(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'milestones'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const postAnnouncement = async () => {
    if (!annText.trim()) return;
    const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Member";
    const authorPhotoURL = currentUser?.photoURL || `https://ui-avatars.com/?name=${encodeURIComponent(userName)}`;
    await addDoc(collection(db, "announcements"), {
      author: userName,
      authorPhotoURL,
      authorFrame: userProfile?.frame || 'border-indigo-500',
      text: annText,
      timestamp: serverTimestamp()
    });
    setAnnText('');
  };

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "Done" || t.status === "เสร็จสิ้น").length,
    pending: tasks.filter(t => t.status !== "Done" && t.status !== "เสร็จสิ้น").length
  };
  const progressPercentage = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  const upcomingTasks = tasks
    .filter(t => t.deadline && t.status !== "เสร็จสิ้น" && t.status !== "Done")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const documentTasks = tasks.filter(t => t.fileUrl || t.externalLink);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20 w-full">
      
      {/* สถิติและ Progress */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">ความคืบหน้าโปรเจกต์</h2>
          <span className="text-lg font-bold text-indigo-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-6">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progressPercentage}%` }} 
            transition={{ duration: 1.5, ease: "easeOut" }} 
            className="bg-indigo-500 h-full rounded-full" 
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase">งานทั้งหมด</p>
            <p className="text-2xl font-black text-slate-700 mt-1">{stats.total}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
            <p className="text-xs font-bold text-emerald-600 uppercase">เสร็จแล้ว</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.done}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
            <p className="text-xs font-bold text-amber-600 uppercase">รอดำเนินการ</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* คอลัมน์ซ้าย: ประกาศ */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-[700px]">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            ประกาศทีม
          </h2>
          
          <div className="flex flex-col gap-2 mb-4">
            <textarea 
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 outline-none focus:border-indigo-300 text-sm resize-none" 
              rows="2"
              placeholder="แจ้งข่าวสารทีม..." 
              value={annText} 
              onChange={(e) => setAnnText(e.target.value)} 
            />
            <button 
              onClick={postAnnouncement} 
              className="bg-slate-800 text-white py-2 rounded-xl hover:bg-slate-900 transition font-semibold text-xs"
            >
              โพสต์ประกาศ
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {announcements.map(ann => <AnnouncementItem key={ann.id} ann={ann} canDelete={isProjectLead} />)}
            {announcements.length === 0 && <p className="text-sm text-slate-400 text-center mt-10">ยังไม่มีประกาศ</p>}
          </div>
        </div>

        {/* คอลัมน์กลาง: ปฏิทิน และ Agenda */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MiniCalendar tasks={tasks} milestones={milestones} />

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                📋 กำหนดการงาน (Agenda)
              </h2>
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{upcomingTasks.length} งาน</span>
            </div>
            
            <div className="space-y-3 h-[250px] overflow-y-auto pr-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">เยี่ยมมาก! ไม่มีงานค้างที่ใกล้ถึงกำหนด</p>
              ) : (
                upcomingTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm transition group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-2 h-2 rounded-full bg-amber-400"></div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-1">รับผิดชอบ: {task.assignedRole}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                        {new Date(task.deadline).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: รายชื่อทีม และเอกสาร */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-[700px]">
          
          {/* รายชื่อทีม (กดคลิกไปหน้า Profile ได้) */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              👥 สมาชิกในทีม
            </h2>
            <div className="overflow-y-auto space-y-3 pr-2 flex-1">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center">กำลังโหลดรายชื่อ...</p>
              ) : (
                teamMembers.map((member, index) => {
                  const fallbackName = member.displayName || member.name || member.email?.split('@')[0] || `Member ${index + 1}`;
                  const photo = member.photoURL || `https://ui-avatars.com/?name=${encodeURIComponent(fallbackName)}&background=random`;
                  const frame = member.frame || 'border-slate-200';
                  
                  return (
                    <div 
                      key={member.id || index} 
                      onClick={() => navigate(`/member/${member.id}`, { state: { member } })}
                      className="flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-xl transition cursor-pointer border border-transparent hover:border-indigo-100 group"
                    >
                      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${frame} flex-shrink-0 bg-slate-200 transition-transform group-hover:scale-105`}>
                        <img 
                          src={photo} 
                          alt={fallbackName} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{fallbackName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{member.title || member.role || 'Team Member'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* เอกสารแนบ */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-[250px] flex flex-col">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              📁 เอกสารแนบ
            </h2>
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {documentTasks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">ยังไม่มีเอกสารแนบ</p>
              ) : (
                documentTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3 hover:bg-slate-100 transition">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 text-sm">
                      📄
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                      <div className="flex gap-2 mt-1">
                        {task.fileUrl && <a href={task.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline">โหลดไฟล์</a>}
                        {task.externalLink && <a href={task.externalLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-600 hover:underline">เปิดลิงก์</a>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;