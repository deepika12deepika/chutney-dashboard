'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CredentialsPage from './components/CredentialsPage';
import { Credential, UserProfile } from './types/credential';

const USER_PROFILES: UserProfile[] = [
  { name: 'Sandhya', role: 'Admin', password: 'sandhya123' },
  { name: 'Abin', role: 'Manager', password: 'abin123' },
  { name: 'Guest', role: 'Viewer', password: 'guest123' }
];

export default function Home() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [activeTab, setActiveTab] = useState('credentials');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES[0]);

  // Load from localStorage on mount
  useEffect(() => {
    // Load credentials
    const savedCreds = localStorage.getItem('dashboard_credentials');
    if (savedCreds) {
      try {
        setCredentials(JSON.parse(savedCreds));
      } catch (e) {
        console.error(e);
      }
    }

    // Load active user
    const savedUser = localStorage.getItem('dashboard_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const match = USER_PROFILES.find(u => u.name === parsed.name);
        if (match) {
          setCurrentUser(match);
        }
      } catch (e) {
        console.error(e);
      }
    }

    setIsLoading(false);
  }, []);

  // Save to localStorage when credentials change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dashboard_credentials', JSON.stringify(credentials));
    }
  }, [credentials, isLoading]);

  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('dashboard_current_user', JSON.stringify(user));
  };

  const handleAddCredential = (newCred: Omit<Credential, 'id' | 'createdAt'>) => {
    const cred: Credential = {
      ...newCred,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setCredentials(prev => [cred, ...prev]);
  };

  const handleUpdateCredential = (id: string, updatedFields: Partial<Credential>) => {
    setCredentials(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleDeleteCredential = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex h-screen bg-[#060814] overflow-hidden font-sans antialiased text-slate-200">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeItem={activeTab} 
        onSelectItem={setActiveTab} 
        currentUser={currentUser}
        userProfiles={USER_PROFILES}
        onSelectUser={handleSelectUser}
      />

      {/* Main dashboard content panel */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header currentUser={currentUser} />

        {/* Dynamic page render based on selected sidebar item */}
        {activeTab === 'credentials' ? (
          <CredentialsPage
            credentials={credentials}
            currentUser={currentUser}
            onAddCredential={handleAddCredential}
            onUpdateCredential={handleUpdateCredential}
            onDeleteCredential={handleDeleteCredential}
          />
        ) : (
          /* Fallback view for other dashboard screens */
          <div className="flex-1 bg-[#060814] p-8 text-slate-100 flex flex-col items-center justify-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-[#09101f] border border-[#16253d] flex items-center justify-center text-2xl mb-4 shadow-lg">
              {activeTab === 'dashboard' ? '📊' :
               activeTab === 'projects' ? '📁' :
               activeTab === 'tasks' ? '✓' :
               activeTab === 'storage' ? '💾' :
               activeTab === 'chat' ? '💬' :
               activeTab === 'social' ? '🌐' :
               activeTab === 'calendar' ? '📅' :
               activeTab === 'news' ? '📰' :
               activeTab === 'attendance' ? '⏱' :
               activeTab === 'requests' ? '📬' : '👥'}
            </div>
            <h2 className="text-[17px] font-bold text-white capitalize leading-snug">{activeTab} Page</h2>
            <p className="text-slate-500 text-[12px] mt-1.5 max-w-xs text-center leading-relaxed">
              This screen is under active development. Click on <strong className="text-slate-300">"Credentials"</strong> in the left menu to manage platform passwords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}