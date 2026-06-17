'use client';

import React from 'react';
import { UserProfile } from '../types/credential';

interface HeaderProps {
  currentUser: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#050912] border-b border-[#15233c] shrink-0 select-none relative z-20">
      {/* Left side: clock and greeting */}
      <div className="flex items-center gap-2 text-slate-300">
        <svg className="w-[18px] h-[18px] text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[13.5px] font-medium tracking-[0.2px] text-slate-300">
          Good Evening, {currentUser.name}
        </span>
      </div>

      {/* Right side: Wallet and control icons */}
      <div className="flex items-center gap-4">
        {/* Wallet balance */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171730] border border-[#2d2054] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.1)] hover:bg-[#1e1e3f] transition-all duration-150 cursor-pointer">
          <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M16 8h.01M22 12h-4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h4" />
          </svg>
          <span className="text-[11.5px] font-bold tracking-wider text-purple-300 uppercase">Wallet: 0</span>
        </div>

        {/* Theme toggle icon (Sun) */}
        <button className="text-slate-400 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-900/40">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </button>

        {/* Notifications bell icon with badge */}
        <button className="text-slate-400 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-900/40 relative">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Orange alert notification badge dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-[#050912]" />
        </button>

        {/* Logout exit door icon */}
        <button className="text-slate-400 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-900/40">
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
