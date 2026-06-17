'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  id: string;
}

const Sidebar: React.FC = () => {
  const [activeItem, setActiveItem] = useState('credentials');

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '#', icon: '⊞' },
    { id: 'projects', label: 'Projects', href: '#', icon: '📁' },
    { id: 'tasks', label: 'Tasks', href: '#', icon: '✓' },
    { id: 'storage', label: 'User Storage', href: '#', icon: '💾' },
    { id: 'chat', label: 'Chat', href: '#', icon: '💬' },
    { id: 'social', label: 'Social Setup', href: '#', icon: '🌐' },
    { id: 'calendar', label: 'Google Calendar', href: '#', icon: '📅' },
    { id: 'news', label: 'Daily News', href: '#', icon: '📰' },
    { id: 'credentials', label: 'Credentials', href: '#', icon: '🔐' },
    { id: 'attendance', label: 'Attendance', href: '#', icon: '⏱' },
    { id: 'requests', label: 'Requests', href: '#', icon: '📬' },
    { id: 'clients', label: 'Clients', href: '#', icon: '👥' },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-[#1a2332] to-[#0f1824] min-h-screen border-r border-[#2a3f5f] shadow-lg">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-[#2a3f5f]">
        <h1 className="text-2xl font-bold text-white tracking-tight">Chutney</h1>
      </div>

      {/* Navigation Items */}
      <nav className="py-6 space-y-2 px-4">
        {navItems.map((item) => (
          <Link key={item.id} href={item.href}>
            <button
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                activeItem === item.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-[#2a3f5f] hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          </Link>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-6 left-4 w-56 p-4 bg-[#252d3d] rounded-lg border border-[#3a4f6f]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Abin</p>
            <p className="text-gray-400 text-xs">Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
