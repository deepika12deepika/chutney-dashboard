'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Task, Employee, SessionUser } from '../types/credential';

interface TasksPageProps {
  currentUser: SessionUser;
}

const PRIORITIES = ['Low', 'Medium', 'High'] as const;
const STATUSES = ['Pending', 'In Progress', 'Completed'] as const;

const TasksPage: React.FC<TasksPageProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState<number | ''>('');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [formStatus, setFormStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [formDueDate, setFormDueDate] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const isAdmin = currentUser.role === 'Admin';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoints = [fetch('/api/tasks')];
      if (isAdmin) {
        endpoints.push(fetch('/api/employees'));
      }
      const responses = await Promise.all(endpoints);
      const tasksData = await responses[0].json();
      setTasks(tasksData.tasks || []);

      if (isAdmin && responses[1]) {
        const empData = await responses[1].json();
        setEmployees(empData.employees || []);
      }
    } catch {
      showToast('Failed to load tasks data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const openAddModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormAssignedTo(employees[0]?.id || '');
    setFormPriority('Medium');
    setFormStatus('Pending');
    setFormDueDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormAssignedTo(task.assigned_to);
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.due_date || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAssignedTo) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    setFormSubmitting(true);

    const payload = {
      title: formTitle,
      description: formDescription,
      assigned_to: formAssignedTo,
      priority: formPriority,
      status: formStatus,
      due_date: formDueDate || null,
    };

    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Update failed', 'error');
          return;
        }
        showToast('Task updated successfully');
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Create failed', 'error');
          return;
        }
        showToast('Task assigned successfully');
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch {
      showToast('Network error', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Delete failed', 'error');
        return;
      }
      showToast('Task deleted successfully');
      fetchAllData();
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || 'Failed to update status', 'error');
        return;
      }
      showToast(`Task marked as ${newStatus}`);
      fetchAllData();
    } catch {
      showToast('Network error', 'error');
    }
  };

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

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assigned_to_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesEmployee = employeeFilter === 'all' || String(t.assigned_to) === employeeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesEmployee;
  });

  const getPriorityStyle = (p: string) => {
    if (p === 'High') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (p === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getStatusStyle = (s: string) => {
    if (s === 'Completed') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    if (s === 'In Progress') return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    return 'bg-slate-700/40 text-slate-400 border-slate-600/25';
  };

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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
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
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">Task Management</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            {isAdmin ? 'Assign, monitor and manage operational activities' : 'View and update your assigned tasks'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-2 shadow-[0_2px_4px_rgba(37,99,235,0.15)] border border-[#3b82f6]/10 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Task
          </button>
        )}
      </div>

      {/* Metrics Widgets */}
      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Tasks */}
          <div className="p-5 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{totalTasks}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/80 mt-1">Total Tasks</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          {/* Pending Tasks */}
          <div className="p-5 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{pendingTasks + inProgressTasks}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100/80 mt-1">Active / Pending</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          {/* Completed Tasks */}
          <div className="p-5 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{completedTasks}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80 mt-1">Completed Tasks</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {/* Overdue Tasks */}
          <div className="p-5 bg-gradient-to-br from-[#ef4444] to-[#dc2626] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{overdueTasks}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100/80 mt-1">Overdue Tasks</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* My Pending Tasks */}
          <div className="p-5 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{pendingTasks + inProgressTasks}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100/80 mt-1">My Active Tasks</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          {/* My Completed Tasks */}
          <div className="p-5 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{completedTasks}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80 mt-1">My Completed</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {/* Upcoming Deadlines */}
          <div className="p-5 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex flex-col">
              <span className="text-[32px] font-bold text-white leading-tight font-mono">{upcomingDeadlinesCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/80 mt-1">Upcoming Deadlines</span>
            </div>
            <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-[#09101f] p-4 rounded-xl border border-[#16253d] mb-6 flex flex-col gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050912] border border-[#172740] text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2 text-[13px] rounded-lg focus:outline-none focus:border-blue-500/80 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#121f35]">
          <div className="flex items-center gap-3">
            {/* Status select filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-[11px] bg-[#050912] border border-[#172740] rounded-lg text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors font-medium"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Priority select filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-[11px] bg-[#050912] border border-[#172740] rounded-lg text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors font-medium"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Employee filter — Admin only */}
            {isAdmin && (
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="px-3 py-1.5 text-[11px] bg-[#050912] border border-[#172740] rounded-lg text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors font-medium"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => <option key={emp.id} value={String(emp.id)}>{emp.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Task List Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <svg className="w-8 h-8 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const isTaskOverdue = task.due_date && task.due_date < todayStr && task.status !== 'Completed';
            return (
              <div key={task.id} className="bg-[#09101f] border border-[#16253d] p-5 rounded-xl hover:border-[#203657] transition-all flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14.5px] font-bold text-white truncate leading-snug">{task.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getPriorityStyle(task.priority)}`}>
                          {task.priority} Priority
                        </span>
                        {isTaskOverdue && (
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status dropdown/badge */}
                    {!isAdmin ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as typeof formStatus)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-lg border focus:outline-none cursor-pointer uppercase tracking-wider ${getStatusStyle(task.status)}`}
                      >
                        {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    ) : (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                        {task.status}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-[12.5px] text-slate-400 mt-2.5 leading-relaxed break-words line-clamp-3">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 pt-3 border-t border-[#111c2e] text-xs">
                    {/* Assigned Info */}
                    {isAdmin && (
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span>Assigned To:</span>
                        <strong className="text-slate-200">{task.assigned_to_name || 'Unassigned'}</strong>
                      </div>
                    )}

                    {/* Assigned By */}
                    {!isAdmin && (
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span>Assigned By:</span>
                        <strong className="text-slate-200">{task.assigned_by_name || 'Admin'}</strong>
                      </div>
                    )}

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span>Due Date:</span>
                        <strong className={isTaskOverdue ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                          {task.due_date}
                        </strong>
                      </div>
                    )}

                    {/* Completed At */}
                    {task.status === 'Completed' && task.completed_at && (
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <span>Completed At:</span>
                        <strong className="text-emerald-400">
                          {new Date(task.completed_at).toLocaleDateString()}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-[#111c2e]">
                  {/* Mark as Completed shortcut for Employees */}
                  {!isAdmin && task.status !== 'Completed' && (
                    <button
                      onClick={() => handleStatusChange(task, 'Completed')}
                      className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-[#22c55e]/20"
                    >
                      Mark as Completed
                    </button>
                  )}

                  {/* Edit/Delete for Admin */}
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEditModal(task)}
                        className="px-3 py-1.5 bg-[#1a2d1a] hover:bg-[#1e3a1e] text-emerald-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-emerald-900/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        className="px-3 py-1.5 bg-[#2d1a1a] hover:bg-[#3a1e1e] text-rose-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-rose-900/30"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed rounded-xl border-slate-800 bg-[#0d1527]/10 flex flex-col items-center justify-center">
          <span className="text-4xl mb-3">✓</span>
          <h3 className="text-sm font-semibold text-slate-300">No tasks found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust filters or create a new task.</p>
        </div>
      )}

      {/* Task Creation / Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-md rounded-xl p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[16px] font-bold text-white mb-5">
              {editingTask ? '✏️ Edit Task' : '➕ Create New Task'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text" required value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Graphic Banner Design"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the task details, links, or expectations..."
                  rows={3}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Assign Employee *</label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(Number(e.target.value))}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Priority *</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as typeof formPriority)}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                {editingTask && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Status *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as typeof formStatus)}
                      className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                    >
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-60"
              >
                {formSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Assign Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
