'use client';

import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-[#0f1824] to-[#1a2332] border-b border-[#2a3f5f] px-8 py-4 flex items-center justify-between shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button className="text-gray-300 hover:text-white transition-colors p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 text-gray-300">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" />
          </svg>
          <span className="font-medium">Good Evening, Abin</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Wallet */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1a2f4f] rounded-lg">
          <span className="text-purple-400 text-sm font-semibold">💎 WALLET: 0</span>
        </div>

        {/* Icons */}
        <button className="text-gray-300 hover:text-yellow-400 transition-colors p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m6.364 1.636l-.707.707M21 12h-1m-1.636 6.364l-.707-.707M12 21v1m-6.364-1.636l.707-.707M3 12h1m1.636-6.364l.707.707" />
          </svg>
        </button>

        <button className="text-gray-300 hover:text-white transition-colors p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <button className="text-gray-300 hover:text-white transition-colors p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v16.5A2.25 2.25 0 003.75 22.5h16.5a2.25 2.25 0 002.25-2.25V13.5" />
          </svg>
        </button>

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
          M
        </div>
      </div>
    </div>
  );
};

export default Header;
