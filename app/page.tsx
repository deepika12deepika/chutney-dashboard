'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CredentialsPage from './components/CredentialsPage';
import EmployeePage from './components/EmployeePage';
import TasksPage from './components/TasksPage';
import NotificationsPage from './components/NotificationsPage';
import DashboardPage from './components/DashboardPage';
import CategoriesPage from './components/CategoriesPage';
import ClientsPage from './components/ClientsPage';
import NewsPage from './components/NewsPage';
import ProjectsPage from './components/ProjectsPage';
import { SessionUser } from './types/credential';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const count = (data.notifications || []).filter((n: any) => !n.is_read).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {
        router.push('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser, fetchUnreadCount]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen bg-[#060814] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-10 h-10 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-slate-500 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'Admin';

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage currentUser={currentUser} onSelectTab={setActiveTab} />;
      case 'projects':
        return <ProjectsPage currentUser={currentUser} />;
      case 'credentials':
        return <CredentialsPage currentUser={currentUser} />;
      case 'tasks':
        return <TasksPage currentUser={currentUser} />;
      case 'notifications':
        return <NotificationsPage currentUser={currentUser} onRefreshCount={fetchUnreadCount} />;
      case 'employees':
        return isAdmin ? <EmployeePage currentUserId={currentUser.id} /> : null;
      case 'categories':
        return isAdmin ? <CategoriesPage currentUser={currentUser} /> : null;
      case 'clients':
        return <ClientsPage currentUser={currentUser} />;
      case 'news':
        return <NewsPage currentUser={currentUser} />;
      default:
        return (
          <div className="flex-1 bg-[#060814] p-8 text-slate-100 flex flex-col items-center justify-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-[#09101f] border border-[#16253d] flex items-center justify-center text-2xl mb-4 shadow-lg">
              {activeTab === 'projects' ? '📁' :
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
              This screen is under active development. Click on{' '}
              <strong className="text-slate-300">&quot;Credentials&quot;</strong> in the left menu to manage platform passwords.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#060814] overflow-hidden font-sans antialiased text-slate-200">
      <Sidebar
        activeItem={activeTab}
        onSelectItem={setActiveTab}
        currentUser={currentUser}
        unreadNotificationsCount={unreadCount}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentUser={currentUser}
          unreadNotificationsCount={unreadCount}
          onBellClick={() => setActiveTab('notifications')}
        />
        {renderPage()}
      </div>
    </div>
  );
}