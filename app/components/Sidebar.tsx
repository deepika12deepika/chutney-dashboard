'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types/credential';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeItem: string;
  onSelectItem: (id: string) => void;
  currentUser: UserProfile;
  userProfiles: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  onSelectItem,
  currentUser,
  userProfiles,
  onSelectUser
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '#',
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
      href: '#',
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
      href: '#',
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
      href: '#',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'chat',
      label: 'Chat',
      href: '#',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'social',
      label: 'Social Setup',
      href: '#',
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
      href: '#',
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
      href: '#',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M16 8h2" />
          <path d="M16 12h2" />
          <path d="M16 16h2" />
          <path d="M6 8h6v8H6z" />
        </svg>
      )
    },
    {
      id: 'credentials',
      label: 'Credentials',
      href: '#',
      icon: (
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 12l.707-.707a3 3 0 1 1 4.243 4.243L16.24 16.24" />
          <circle cx="7.5" cy="16.5" r="1.5" />
        </svg>
      )
    },
    {
      id: 'attendance',
      label: 'Attendance',
      href: '#',
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
      href: '#',
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
      href: '#',
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

  const handleUserClick = (user: UserProfile) => {
    onSelectUser(user);
    setShowUserDropdown(false);
  };

  const getAvatarLetter = (name: string) => {
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <aside className="w-64 flex flex-col bg-[#050912] border-r border-[#15233c] py-6 select-none shrink-0 min-h-screen relative z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 pb-6 border-b border-[#111c2e]">
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-semibold tracking-wide text-white font-sans">Chutney</span>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-[8px] overflow-y-auto">
        {navItems.map((item) => {
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
              </button>
            </div>
          );
        })}
      </nav>

      {/* User profile footer section with Popover Switcher */}
      <div className="px-6 pt-4 border-t border-[#111c2e] relative" ref={dropdownRef}>
        {/* User Selection Popover Dropdown */}
        {showUserDropdown && (
          <div className="absolute bottom-16 left-4 right-4 bg-[#09101f] border border-[#203657] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans text-xs font-semibold">
            <div className="px-3 py-1.5 text-slate-500 text-[10px] uppercase tracking-wider border-b border-[#111c2e] mb-1">
              Switch Account Profile
            </div>
            {userProfiles.map((user) => (
              <button
                key={user.name}
                onClick={() => handleUserClick(user)}
                className={`flex items-center gap-2.5 px-2.5 py-2 w-full rounded-lg text-left cursor-pointer transition-colors ${
                  currentUser.name === user.name
                    ? 'bg-[#2563eb] text-white'
                    : 'text-slate-300 hover:bg-[#121c2e]/60 hover:text-white'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentUser.name === user.name
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1a2f4f] text-blue-400'
                }`}>
                  {getAvatarLetter(user.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate leading-tight">{user.name}</span>
                  <span className={`text-[9px] leading-tight ${currentUser.name === user.name ? 'text-blue-100' : 'text-slate-500'}`}>
                    {user.role}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Profile Footer Button */}
        <div 
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center gap-3 cursor-pointer hover:bg-[#121c2e]/30 p-2 -mx-2 rounded-lg transition-colors group"
          title="Click to Switch Profile"
        >
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
            {getAvatarLetter(currentUser.name)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white font-semibold text-[13.5px] truncate leading-tight group-hover:text-blue-400 transition-colors">
              {currentUser.name}
            </span>
            <span className="text-slate-500 text-[11px] font-medium tracking-wide">
              {currentUser.role}
            </span>
          </div>
          {/* Caret/Indicator Icon */}
          <svg className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
