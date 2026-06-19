'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, Notification, SessionUser } from '../types/credential';

interface DashboardPageProps {
  currentUser: SessionUser;
  onSelectTab: (tab: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onSelectTab }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = currentUser.role === 'Admin';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, notificationsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/notifications')
      ]);
      
      const tasksData = await tasksRes.json();
      const notificationsData = await notificationsRes.json();
      
      setTasks(tasksData.tasks || []);
      setNotifications(notificationsData.notifications || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Metrics calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'Completed' || !t.due_date) return false;
    return t.due_date < todayStr;
  }).length;

  const upcomingDeadlinesCount = tasks.filter((t) => {
    if (t.status === 'Completed' || !t.due_date) return false;
    const diffTime = new Date(t.due_date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // Filter latest 5 notifications for the widget
  // Admin: Show latest completed tasks (type: task_completed)
  // Employee: Show latest assigned tasks (type: task_assigned)
  const widgetNotifications = notifications
    .filter(n => isAdmin ? n.type === 'task_completed' : n.type === 'task_assigned')
    .slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-100 overflow-y-auto flex flex-col relative select-none">
      {/* Welcome banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-[#091024] via-[#0b1430] to-[#070e24] rounded-2xl border border-[#16254a]/30 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <h1 className="text-[24px] font-bold text-white tracking-[0.2px]">
            {getGreeting()}, {currentUser.name}!
          </h1>
          <p className="text-[13px] text-slate-400 mt-1 max-w-xl">
            Welcome to the operational command center. Below is an overview of active tasks, system alerts, and credential permissions.
          </p>
        </div>
        <div className="shrink-0 relative z-10 flex gap-2">
          <button
            onClick={() => onSelectTab('credentials')}
            className="px-3.5 py-1.5 bg-[#171c35] hover:bg-[#20274a] text-slate-200 text-[12px] font-semibold rounded-lg border border-[#262f5e] transition-colors cursor-pointer"
          >
            Manage Credentials
          </button>
          <button
            onClick={() => onSelectTab('tasks')}
            className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold rounded-lg transition-colors cursor-pointer shadow-[0_2px_4px_rgba(37,99,235,0.2)] border border-blue-500/10"
          >
            Go to Tasks
          </button>
        </div>
        {/* Abstract background blur shapes */}
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <svg className="w-8 h-8 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : (
        <>
          {/* Metrics Section */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold uppercase tracking-wider text-slate-400 mb-4">Task Dashboard</h2>
            {isAdmin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="p-5 bg-gradient-to-br from-[#1e3a8a]/40 to-[#0f172a] border border-[#2563eb]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{totalTasks}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Tasks</span>
                  </div>
                  <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/25 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                {/* Pending Tasks */}
                <div className="p-5 bg-gradient-to-br from-[#78350f]/30 to-[#0f172a] border border-[#d97706]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{pendingTasks + inProgressTasks}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Active / Pending</span>
                  </div>
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-center justify-center text-amber-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                {/* Completed Tasks */}
                <div className="p-5 bg-gradient-to-br from-[#064e3b]/30 to-[#0f172a] border border-[#059669]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{completedTasks}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Completed Tasks</span>
                  </div>
                  <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/25 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {/* Overdue Tasks */}
                <div className="p-5 bg-gradient-to-br from-[#991b1b]/20 to-[#0f172a] border border-[#dc2626]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{overdueTasks}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Overdue Tasks</span>
                  </div>
                  <div className="w-11 h-11 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center justify-center text-rose-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* My Pending Tasks */}
                <div className="p-5 bg-gradient-to-br from-[#78350f]/30 to-[#0f172a] border border-[#d97706]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{pendingTasks + inProgressTasks}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">My Active Tasks</span>
                  </div>
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-center justify-center text-amber-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                {/* My Completed Tasks */}
                <div className="p-5 bg-gradient-to-br from-[#064e3b]/30 to-[#0f172a] border border-[#059669]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{completedTasks}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">My Completed</span>
                  </div>
                  <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/25 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                {/* Upcoming Deadlines */}
                <div className="p-5 bg-gradient-to-br from-[#1e3a8a]/40 to-[#0f172a] border border-[#2563eb]/20 rounded-xl flex justify-between items-center shadow-md">
                  <div className="flex flex-col">
                    <span className="text-[30px] font-bold text-white leading-tight font-mono">{upcomingDeadlinesCount}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Upcoming Deadlines</span>
                  </div>
                  <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/25 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Box: Quick Navigation / Dashboard Guide */}
            <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-6 shadow-lg">
              <h3 className="text-[14.5px] font-bold text-white mb-4">Operations Overview</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-[#050912] border border-[#111c2e] hover:border-[#1c2e4d] transition-all cursor-pointer" onClick={() => onSelectTab('credentials')}>
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 font-bold">🗝</div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-white leading-snug">Credentials Safe</h4>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                      Secure password repository with role-based folder controls.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-[#050912] border border-[#111c2e] hover:border-[#1c2e4d] transition-all cursor-pointer" onClick={() => onSelectTab('tasks')}>
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold">✓</div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-white leading-snug">Operational Tasks</h4>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                      Track timelines, priorities, and workflow execution.
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-start gap-3.5 p-3 rounded-lg bg-[#050912] border border-[#111c2e] hover:border-[#1c2e4d] transition-all cursor-pointer" onClick={() => onSelectTab('employees')}>
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 font-bold">👥</div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-white leading-snug">Team Management</h4>
                      <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                        Add users, set skills/work description, and grant folders permissions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Dashboard Notification Widget */}
            <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-6 shadow-lg flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#121f35]">
                  <h3 className="text-[14.5px] font-bold text-white">
                    {isAdmin ? '🔔 Latest Completed Tasks' : '🔔 My Latest Task Assignments'}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Latest 5</span>
                </div>

                {widgetNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {widgetNotifications.map((n) => {
                      return (
                        <div key={n.id} className="p-3 bg-[#050912]/80 border border-[#111c2e] rounded-lg flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-bold text-white leading-tight truncate">{n.title}</p>
                            <p className="text-[11.5px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="text-[9.5px] text-slate-500 mt-1 block font-medium">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-[12.5px] flex flex-col items-center justify-center">
                    <span className="text-2xl mb-2">🎉</span>
                    <p className="font-semibold text-slate-400">No active updates</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isAdmin ? 'No completed tasks reported yet.' : 'All tasks currently sorted.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#121f35] mt-4 flex justify-end">
                <button
                  onClick={() => onSelectTab('notifications')}
                  className="text-[12px] font-bold text-[#2563eb] hover:text-[#3b82f6] hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  View All Notifications
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
