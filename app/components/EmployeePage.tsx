'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Employee, Category, Permission } from '../types/credential';

interface EmployeePageProps {
  currentUserId: number;
}

const ROLES = ['Admin', 'Manager', 'Employee'] as const;

const EmployeePage: React.FC<EmployeePageProps> = ({ currentUserId }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForPerms, setSelectedEmployeeForPerms] = useState<Employee | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Manager' | 'Employee'>('Employee');
  const [formWork, setFormWork] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, catRes, permRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/categories'),
        fetch('/api/permissions'),
      ]);
      const empData = await empRes.json();
      const catData = await catRes.json();
      const permData = await permRes.json();

      setEmployees(empData.employees || []);
      setCategories(catData.categories || []);
      setPermissions(permData.permissions || []);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Employee');
    setFormWork('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPassword('');
    setFormRole(emp.role);
    setFormWork(emp.work || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingEmployee) {
        const res = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, email: formEmail, role: formRole, password: formPassword || undefined, work: formWork }),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Update failed', 'error');
          return;
        }
        showToast('Employee updated successfully');
      } else {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, email: formEmail, password: formPassword, role: formRole, work: formWork }),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Create failed', 'error');
          return;
        }
        showToast('Employee created successfully');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch {
      showToast('Network error', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`Delete employee "${emp.name}"? This will also remove all their permissions.`)) return;
    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || 'Delete failed', 'error');
        return;
      }
      showToast('Employee deleted');
      fetchAll();
    } catch {
      showToast('Network error', 'error');
    }
  };

  const getEmployeePermissions = (empId: number) =>
    permissions.filter((p) => p.userId === empId);

  const hasPermission = (empId: number, catId: number) =>
    permissions.some((p) => p.userId === empId && p.categoryId === catId);

  const togglePermission = async (empId: number, catId: number) => {
    if (hasPermission(empId, catId)) {
      // Revoke
      await fetch('/api/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: empId, categoryId: catId }),
      });
    } else {
      // Grant
      await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: empId, categoryId: catId }),
      });
    }
    fetchAll();
  };

  const getRoleStyle = (role: string) => {
    if (role === 'Admin') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (role === 'Manager') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-slate-700/30 text-slate-400 border-slate-600/20';
  };

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-100 overflow-y-auto relative">

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

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">Employee Management</h1>
          <p className="text-[13px] text-slate-400 mt-1">Manage team members, roles and credential access</p>
        </div>
        <button
          id="add-employee-btn"
          onClick={openAddModal}
          className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-2 shadow-[0_2px_6px_rgba(37,99,235,0.2)] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-[28px] font-bold text-white font-mono leading-none">{employees.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Total Team</p>
          </div>
        </div>
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <p className="text-[28px] font-bold text-white font-mono leading-none">{categories.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Categories</p>
          </div>
        </div>
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[28px] font-bold text-white font-mono leading-none">{permissions.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Permissions</p>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-[#09101f] border border-[#16253d] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#111c2e] flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-white">Team Members</h2>
          <span className="text-[11px] text-slate-500">{employees.length} total</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">No employees yet. Click "Add Employee" to get started.</div>
        ) : (
          <div className="divide-y divide-[#0f1c2e]">
            {employees.map((emp) => {
              const empPerms = getEmployeePermissions(emp.id);
              return (
                <div key={emp.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#0a1120]/50 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-white truncate">{emp.name}</span>
                      {emp.id === currentUserId && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">You</span>
                      )}
                    </div>
                    <span className="text-[12px] text-slate-500">
                      {emp.email} {emp.work && <span className="text-[#3b82f6] font-semibold ml-2">• {emp.work}</span>}
                    </span>
                  </div>

                  {/* Role Badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getRoleStyle(emp.role)}`}>
                    {emp.role}
                  </span>

                  {/* Permission count */}
                  <div className="text-center min-w-[80px]">
                    <p className="text-[13px] font-bold text-white">{empPerms.length}</p>
                    <p className="text-[10px] text-slate-500">permissions</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setSelectedEmployeeForPerms(emp); setIsPermissionModalOpen(true); }}
                      className="px-3 py-1.5 bg-[#1a2f4f] hover:bg-[#1e3a5f] text-blue-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-blue-900/30"
                      title="Manage Permissions"
                    >
                      Permissions
                    </button>
                    <button
                      onClick={() => openEditModal(emp)}
                      className="px-3 py-1.5 bg-[#1a2d1a] hover:bg-[#1e3a1e] text-emerald-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-emerald-900/30"
                    >
                      Edit
                    </button>
                    {emp.id !== currentUserId && (
                      <button
                        onClick={() => handleDelete(emp)}
                        className="px-3 py-1.5 bg-[#2d1a1a] hover:bg-[#3a1e1e] text-rose-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-rose-900/30"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-md rounded-xl p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[16px] font-bold text-white mb-5">
              {editingEmployee ? '✏️ Edit Employee' : '➕ Add New Employee'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text" required value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sandhya"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email" required value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. employee@beyondbranding.com"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Password {editingEmployee ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingEmployee}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as typeof formRole)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Work Specialization / Job Role</label>
                <input
                  type="text"
                  value={formWork}
                  onChange={(e) => setFormWork(e.target.value)}
                  placeholder="e.g. Social Media, Website, Graphic designer, Video Editor"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-60"
              >
                {formSubmitting ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Create Employee'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Permission Management Modal */}
      {isPermissionModalOpen && selectedEmployeeForPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-sm rounded-xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
            <button onClick={() => setIsPermissionModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-4">
              <h3 className="text-[15px] font-bold text-white">Category Permissions</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Access for <span className="text-blue-400 font-semibold">{selectedEmployeeForPerms.name}</span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {categories.length === 0 ? (
                <p className="text-slate-500 text-[12px] text-center py-8">No categories found. Create some first.</p>
              ) : (
                categories.map((cat) => {
                  const granted = hasPermission(selectedEmployeeForPerms.id, cat.id);
                  return (
                    <div key={cat.id} className="flex items-center justify-between bg-[#050912]/60 border border-[#16253d]/50 px-4 py-3 rounded-lg">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-200">{cat.name}</p>
                        {cat.description && <p className="text-[10px] text-slate-500 mt-0.5">{cat.description}</p>}
                      </div>
                      <button
                        onClick={() => togglePermission(selectedEmployeeForPerms.id, cat.id)}
                        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${granted ? 'bg-blue-600' : 'bg-slate-700'}`}
                        title={granted ? 'Revoke access' : 'Grant access'}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${granted ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-4 mt-2 border-t border-[#111c2e]">
              <p className="text-[11px] text-slate-600 text-center">
                Toggle switches to grant / revoke category access
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;
