import React, { useContext } from 'react';
import { TaskContext } from '../context/TaskContext';

const ActivityFeed = () => {
  const { tasks } = useContext(TaskContext);
  // ดึงเฉพาะ 5 งานล่าสุด
  const recentTasks = [...tasks].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mt-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Recent Activities</h3>
      <div className="space-y-4">
        {recentTasks.map(t => (
          <div key={t.id} className="flex items-center gap-4">
            {/* Status indicator ที่ดูนุ่มนวล */}
            <div className={`w-2 h-2 rounded-full ${t.status === "Done" ? "bg-emerald-400" : "bg-indigo-400"}`}></div>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{t.owner}</span> 
              <span className="text-slate-400 mx-2">—</span> 
              {t.title} 
              <span className="ml-2 text-xs text-slate-300">
                {t.status === "Done" ? "completed" : "in progress"}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;