'use client';

import React, { useState } from 'react';

interface StatCard {
  title: string;
  value: number;
  color: string;
  icon: string;
  bgGradient: string;
}

const CredentialsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  const statCards: StatCard[] = [
    {
      title: 'TOTAL CREDENTIALS',
      value: 0,
      color: 'text-white',
      icon: '🔑',
      bgGradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'ACTIVE',
      value: 0,
      color: 'text-white',
      icon: '✓',
      bgGradient: 'from-green-400 to-green-500',
    },
    {
      title: 'CLIENTS',
      value: 11,
      color: 'text-white',
      icon: '💼',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'PLATFORMS',
      value: 18,
      color: 'text-white',
      icon: '🌐',
      bgGradient: 'from-orange-400 to-orange-500',
    },
  ];

  return (
    <div className="flex-1 bg-gradient-to-br from-[#0a1929] via-[#0f1c2c] to-[#0a1929] min-h-screen p-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Credentials Management</h1>
          <p className="text-gray-400 text-lg">Securely manage all client platform credentials</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2">
            <span>🏢</span> Manage Clients
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2">
            <span>➕</span> Add Credential
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.bgGradient} rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 relative overflow-hidden`}
          >
            {/* Background decoration */}
            <div className="absolute top-2 right-2 opacity-20 text-4xl">{card.icon}</div>
            
            <div className="relative z-10">
              <p className="text-white text-sm font-semibold opacity-80 mb-2">{card.title}</p>
              <h3 className="text-5xl font-bold text-white">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-4 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a2f4f] border border-[#2a4f7f] text-white placeholder-gray-500 pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
        </div>

        {/* Filter Tabs and Dropdown */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {['ALL', 'ACTIVE', 'INACTIVE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                  activeTab === tab.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Client Dropdown */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-[#1a2f4f] border border-[#2a4f7f] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option>All Clients</option>
            <option>Client 1</option>
            <option>Client 2</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-gradient-to-br from-[#1a2f4f] to-[#0f1c2c] rounded-lg border border-[#2a4f7f] p-16 flex flex-col items-center justify-center text-center">
        <svg className="w-24 h-24 text-gray-600 mb-6 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5m0 0l-2-5m2 5v-6a1 1 0 00-1-1h-2a1 1 0 00-1 1v6m4-15H9a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2z" />
        </svg>
        <h3 className="text-2xl font-bold text-white mb-2">No credentials found</h3>
        <p className="text-gray-400 mb-6">Try adjusting your filters or add new credentials</p>
        <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Add Credential
        </button>
      </div>
    </div>
  );
};

export default CredentialsPage;
