import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfileBadge = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const handleProfileClick = () => {
    navigate('/profile');
  };

  const displayImage = user?.photoURL || `https://ui-avatars.com/?name=${user?.displayName || 'User'}`;
  const frameClass = userProfile?.frame || 'border-slate-300';
  const displayName = user?.displayName || 'USER';
  const title = userProfile?.title || '';
  const showTitle = userProfile?.showTitle !== false;

  return (
    <button
      type="button"
      onClick={handleProfileClick}
      className={`relative flex items-center gap-3 p-1 pr-4 rounded-full border-2 ${frameClass} bg-white hover:bg-slate-50 transition galaxy-border`}
    >
      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white">
        <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-sm font-semibold text-slate-800">{displayName}</span>
        {showTitle && title && <span className="text-xs galaxy-title">{title}</span>}
      </div>
    </button>
  );
};

export default ProfileBadge;