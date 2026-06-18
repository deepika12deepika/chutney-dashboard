'use client';

import React, { useState } from 'react';
import { SessionUser } from '../types/credential';



interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

interface SidebarProps {
  activeItem: string;
  onSelectItem: (id: string) => void;
  currentUser: SessionUser;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelectItem, currentUser }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'Admin';   
  // const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Manager';

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      id: 'projects',
      label: 'Projects',
      adminOnly: true,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    {
      id: 'storage',
      label: 'User Storage',
      adminOnly: true,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'social',
      label: 'Social Setup',
      adminOnly: true,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    {
      id: 'calendar',
      label: 'Google Calendar',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      id: 'news',
      label: 'Daily News',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M16 8h2" /><path d="M16 12h2" /><path d="M16 16h2" />
          <path d="M6 8h6v8H6z" />
        </svg>
      )
    },
    {
      id: 'credentials',
      label: 'Credentials',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 12l.707-.707a3 3 0 1 1 4.243 4.243L16.24 16.24" />
          <circle cx="7.5" cy="16.5" r="1.5" />
        </svg>
      )
    },
    {
      id: 'employees',
      label: 'Employees',
      adminOnly: true,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      )
    },
    {
      id: 'clients',
      label: 'Clients',
      adminOnly: true,
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    }
  ];

  // Filter nav items by role
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const getAvatarLetter = (name: string) => name.trim().charAt(0).toUpperCase();

  return (
    <aside className="w-64 flex flex-col bg-[#050912] border-r border-[#15233c] py-6 select-none shrink-0 min-h-screen relative z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 pb-6 border-b border-[#111c2e]">
        <div className="flex items-center gap-2.5">
          <img
            src="/Chutney-logo.svg"
            alt="Chutney Logo"
            style={{ height: '30px', width: 'auto' }}
          />
        </div>
        <button className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-[8px] overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = activeItem === item.id;
          const isHovered = hoveredItem === item.id;
          const showMovingBorder = isActive || isHovered;

          return (
            <div
              key={item.id}
              className={`rounded-lg transition-all duration-150 ${showMovingBorder ? 'moving-border-container' : ''}`}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => onSelectItem(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] font-medium rounded-lg border cursor-pointer relative z-10 transition-all duration-150 text-left ${
                  isActive
                    ? 'text-white border-transparent bg-[#09101f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                    : isHovered
                      ? 'text-slate-200 border-transparent bg-[#070e1c]'
                      : 'text-slate-400 border-transparent bg-transparent hover:text-slate-200'
                }`}
              >
                <span className={`transition-colors duration-150 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="tracking-[0.1px]">{item.label}</span>
                {/* Admin badge on admin-only items */}
                {item.adminOnly && (
                  <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#1e3a5f] text-blue-400 uppercase tracking-wider border border-blue-900/40">
                    Admin
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User profile footer — shows current logged-in user */}
      <div className="px-6 pt-4 border-t border-[#111c2e]">
        <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg bg-[#0d1628]/50">
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {getAvatarLetter(currentUser.name)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white font-semibold text-[13.5px] truncate leading-tight">
              {currentUser.name}
            </span>
            <span className="text-slate-500 text-[11px] font-medium tracking-wide truncate">
              {currentUser.email}
            </span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
            currentUser.role === 'Admin'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              : 'bg-slate-700/40 text-slate-400 border border-slate-600/20'
          }`}>
            {currentUser.role}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
