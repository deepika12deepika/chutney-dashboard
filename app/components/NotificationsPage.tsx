'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Notification, SessionUser } from '../types/credential';

interface NotificationsPageProps {
  currentUser: SessionUser;
  onRefreshCount?: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser, onRefreshCount }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      if (onRefreshCount) {
        onRefreshCount();
      }
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [onRefreshCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        showToast('Failed to mark notification as read', 'error');
        return;
      }
      showToast('Notification marked as read');
      // Update local state directly for speed, then fetch
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (onRefreshCount) {
        onRefreshCount();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (!res.ok) {
        showToast('Failed to mark all as read', 'error');
        return;
      }
      showToast('All notifications marked as read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onRefreshCount) {
        onRefreshCount();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        showToast('Failed to delete notification', 'error');
        return;
      }
      showToast('Notification deleted');
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (onRefreshCount) {
        onRefreshCount();
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_completed':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'task_assigned':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
        );
      case 'credential_assigned':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-.996.43-1.563A6 6 0 1 1 21.75 8.25z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12.01" y2="16" /><path d="M12 8v4" />
            </svg>
          </div>
        );
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-100 overflow-y-auto flex flex-col relative select-none">
      
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-2xl font-medium text-sm border flex items-center gap-2 ${
          toastType === 'success'
            ? 'bg-[#16a34a] border-[#22c55e]/30 text-white'
            : 'bg-rose-700 border-rose-500/30 text-white'
        }`}>
          {toastType === 'success' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">Notification Center</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Stay up to date with task updates and credential assignments
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 hover:text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-2 border border-[#374151] cursor-pointer"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Stats Summary Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center">
            <span className="text-rose-400 font-bold text-lg font-mono">{unreadCount}</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white leading-none">Unread Notifications</p>
            <p className="text-[11px] text-slate-500 mt-1">Action items or new updates needing attention</p>
          </div>
        </div>
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-slate-500/10 border border-slate-500/20 rounded-lg flex items-center justify-center">
            <span className="text-slate-400 font-bold text-lg font-mono">{notifications.length}</span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white leading-none">Total History</p>
            <p className="text-[11px] text-slate-500 mt-1">Maximum 100 entries stored locally</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <svg className="w-8 h-8 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl overflow-hidden shadow-lg divide-y divide-[#121f35]">
          {notifications.map((n) => {
            return (
              <div
                key={n.id}
                className={`flex items-start md:items-center justify-between p-5 transition-colors gap-4 ${
                  n.is_read ? 'hover:bg-[#0c1527]/30' : 'bg-[#0d162d]/40 hover:bg-[#0d162d]/60 border-l-[3px] border-blue-500'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {getNotificationIcon(n.type)}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13.5px] font-bold text-white truncate leading-snug">
                        {n.title || 'Notification'}
                      </h3>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                      )}
                    </div>
                    <p className="text-[12.5px] text-slate-400 mt-1 break-words leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1.5 block font-medium">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-3 py-1.5 bg-[#1e2a44] hover:bg-[#2c3d63] text-blue-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-blue-900/30"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 bg-transparent hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900/30"
                    title="Delete Notification"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed rounded-xl border-slate-800 bg-[#0d1527]/10 flex flex-col items-center justify-center">
          <span className="text-4xl mb-3">🔔</span>
          <h3 className="text-sm font-semibold text-slate-300">All caught up!</h3>
          <p className="text-xs text-slate-500 mt-1">No notifications found.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
