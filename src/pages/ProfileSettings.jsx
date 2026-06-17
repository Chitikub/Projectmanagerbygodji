import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { supabase } from '../supabaseClient';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const ProfileSettings = () => {
  const { refreshUser, user } = useAuth();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Team Lead');
  const [customTitle, setCustomTitle] = useState('');
  const [showTitle, setShowTitle] = useState(true);
  const [photoURL, setPhotoURL] = useState('');
  const [frame, setFrame] = useState('border-indigo-500');
  const [role, setRole] = useState('Frontend Developer');
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // รายการคำบ่งบอกสถานะโปรไฟล์
  const titleOptions = [
    { id: 'Team Lead', label: 'Team Lead' },
    { id: 'Goal Planner', label: 'Goal Planner' },
    { id: 'Focus Specialist', label: 'Focus Specialist' },
    { id: 'Sprint Lead', label: 'Sprint Lead' },
    { id: 'Custom', label: 'Custom Status' },
  ];

  // ตัวเลือกกรอบโปรไฟล์
  const frameOptions = [
    { id: 'border-slate-400', label: 'Standard', bg: 'bg-slate-400' },
    { id: 'border-amber-400', label: 'Gold', bg: 'bg-amber-400' },
    { id: 'frame-cyber', label: 'Blue Accent', bg: 'bg-cyan-400' },
    { id: 'frame-lava', label: 'Red Accent', bg: 'bg-rose-500' },
    { id: 'frame-toxic', label: 'Green Accent', bg: 'bg-emerald-400' },
    { id: 'frame-void', label: 'Purple Accent', bg: 'bg-fuchsia-600' },
  ];

  const roleOptions = [
    'Frontend Developer',
    'Backend Developer',
    'QA (Frontend/Backend)',
    'Project Lead',
  ];

  const rewardOptions = [
    { id: 'Leadership Badge', label: 'คำบ่งบอกสถานะ: Leadership Badge', type: 'title', cost: 50 },
    { id: 'Innovation Badge', label: 'คำบ่งบอกสถานะ: Innovation Badge', type: 'title', cost: 100 },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFrame(data.frame || 'border-slate-400');
        setShowTitle(data.showTitle !== false);
        setRole(data.role || 'Frontend Developer');
        setPoints(data.points || 0);
        setPhotoURL(data.photoURL || user.photoURL || '');
        if (data.title && titleOptions.some((option) => option.id === data.title)) {
          setTitle(data.title);
          setCustomTitle('');
        } else if (data.title === 'Leadership Badge' || data.title === 'Innovation Badge') {
          setTitle(data.title);
          setCustomTitle('');
        } else if (data.title) {
          setTitle('Custom');
          setCustomTitle(data.title);
        } else {
          setTitle('Team Lead');
          setCustomTitle('');
        }
      }
    };
    loadProfile();
  }, [user]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = publicUrlData.publicUrl;
      setPhotoURL(publicUrl);
      await setDoc(doc(db, 'users', user.uid), { photoURL: publicUrl }, { merge: true });
      await updateProfile(user, { photoURL: publicUrl });
      alert("อัปโหลดรูปภาพสำเร็จ!");
    } catch (error) {
      alert("ไม่สามารถอัปโหลดรูปได้: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert('กรุณากรอกข้อมูลรหัสผ่านให้ครบถ้วน');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      alert('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (error) {
      alert('ไม่สามารถเปลี่ยนรหัสผ่านได้: ' + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const selectedTitle = title === 'Custom' ? customTitle.trim() : title;

  const saveProfile = async () => {
    try {
      if (!user) return;
      await updateProfile(user, { displayName: name, photoURL: photoURL });
      await setDoc(
        doc(db, "users", user.uid),
        { frame, title: selectedTitle, showTitle, role, points, photoURL },
        { merge: true }
      );
      refreshUser(); 
      alert("บันทึกการตั้งค่าโปรไฟล์สำเร็จ! 💾");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // ฟังก์ชันช่วยเช็ค CSS คลาสสำหรับฉายาพิเศษ
  const getTitleClass = (t) => {
    if (t === 'Leadership Badge') return 'text-emerald-500 font-bold';
    if (t === 'Innovation Badge') return 'text-indigo-500 font-bold';
    return 'text-slate-500 font-bold';
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 w-full">
      
      {/* Header โปรไฟล์ */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.15),transparent_40%)]" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            
            {/* ตัวอย่างภาพโปรไฟล์ */}
            <div className="flex flex-col items-center">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 bg-slate-800 transition-all duration-300 ${frame}`}>
                <img src={photoURL || 'https://ui-avatars.com/?name=User'} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-wider drop-shadow-md">{name || 'ไม่ระบุชื่อ'}</h2>
              {showTitle && selectedTitle && (
                <p className={`mt-1 text-sm tracking-widest ${getTitleClass(selectedTitle)}`}>
                  {selectedTitle}
                </p>
              )}
            </div>

            {/* ข้อมูลสถิติ (Stats) */}
            <div className="flex-1 w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
               <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-4">ข้อมูลโปรไฟล์</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                     <p className="text-[10px] text-slate-400 uppercase font-bold">ตำแหน่ง</p>
                     <p className="text-sm font-bold text-indigo-300 mt-1 truncate">{role}</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-amber-500/20 blur-xl"></div>
                     <p className="text-[10px] text-amber-200/70 uppercase font-bold relative">คะแนนสะสม</p>
                     <p className="text-xl font-black text-amber-400 mt-1 relative drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                       {points}
                     </p>
                  </div>
               </div>
            </div>

         </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* คอลัมน์ตั้งค่ารูปลักษณ์ */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b pb-2">ข้อมูลส่วนตัว</h3>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">ชื่อที่แสดง</label>
            <input 
              className="w-full mt-2 p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-indigo-500 transition-colors font-bold text-slate-800" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="กรอกชื่อที่ต้องการแสดง"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">รูปโปรไฟล์</label>
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-sm font-bold text-slate-600">
                {loading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ'}
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-3xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3">เปลี่ยนรหัสผ่าน</h4>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                className="w-full mt-2 p-3 bg-white rounded-xl border border-slate-200 outline-none"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="รหัสผ่านปัจจุบัน"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">รหัสผ่านใหม่</label>
              <input
                type="password"
                className="w-full mt-2 p-3 bg-white rounded-xl border border-slate-200 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                className="w-full mt-2 p-3 bg-white rounded-xl border border-slate-200 outline-none"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
            >
              {passwordLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">เลือกกรอบโปรไฟล์</label>
            <div className="flex flex-wrap gap-3">
              {frameOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFrame(option.id)}
                  title={option.label}
                  className={`w-12 h-12 rounded-full border-4 transition-all duration-300 ${option.id} ${frame === option.id ? 'scale-110 shadow-lg ring-4 ring-indigo-100' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* คอลัมน์ตั้งค่าสายอาชีพและร้านค้า */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2"> ตำแหน่งเและตกแต่ง</h3>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">ข้อความแสดงสถานะ</label>
              <select className="w-full mt-2 p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 font-semibold text-slate-700" value={title} onChange={(e) => setTitle(e.target.value)}>
                {titleOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                {(title === 'Leadership Badge' || title === 'Innovation Badge') && (
                  <option value={title}>{title} (ปลดล็อกแล้ว)</option>
                )}
              </select>
              
              {title === 'Custom' && (
                <motion.input
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="พิมพ์ข้อความแสดงสถานะ"
                />
              )}

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={showTitle} onChange={(e) => setShowTitle(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <span className="text-xs font-bold text-slate-600">แสดงข้อความสถานะบนโปรไฟล์</span>
              </label>
            </div>
          </div>

          {/* ร้านค้าแลกรางวัล */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] p-6 shadow-sm border border-amber-200">
            <h3 className="text-lg font-bold text-amber-800 border-b border-amber-200/50 pb-2 mb-4">การตั้งค่าพิเศษ</h3>
            <div className="space-y-3">
              {rewardOptions.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between bg-white p-3 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition">
                  <div>
                    <p className={`text-sm font-bold ${reward.type === 'title' ? getTitleClass(reward.id) : 'text-slate-700'}`}>
                      {reward.label}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                      🪙 {reward.cost} Gold
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (points < reward.cost) {
                        alert('คุณมีแต้มไม่พอแลกไอเทมนี้! ไปทำงานให้เสร็จก่อนนะ ⚔️');
                        return;
                      }
                      if (window.confirm(`ยืนยันการใช้ ${reward.cost} Gold เพื่อแลกรับ [${reward.label}]?`)) {
                        const nextPoints = points - reward.cost;
                        setPoints(nextPoints);
                        if (reward.type === 'title') {
                          setTitle(reward.id);
                          setCustomTitle('');
                        }
                        await setDoc(doc(db, 'users', auth.currentUser.uid), {
                          points: nextPoints,
                          title: reward.type === 'title' ? reward.id : selectedTitle,
                        }, { merge: true });
                        alert("ยินดีด้วย! การตั้งค่าใหม่ถูกบันทึกเรียบร้อยแล้ว");
                      }
                    }}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-2 rounded-xl hover:scale-105 transition-transform shadow-md"
                  >
                    แลกซื้อ
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ปุ่มบันทึกโปรไฟล์ */}
      <button 
        onClick={saveProfile} 
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg py-4 rounded-[2rem] hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
      >
        บันทึกโปรไฟล์
      </button>

    </div>
  );
};

export default ProfileSettings;