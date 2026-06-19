'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Category, SessionUser } from '../types/credential';

interface CategoriesPageProps {
  currentUser: SessionUser;
}

const CategoriesPage: React.FC<CategoriesPageProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
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

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    setFormSubmitting(true);

    const payload = {
      name: formName,
      description: formDescription,
    };

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Update failed', 'error');
          return;
        }
        showToast('Category updated successfully');
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Create failed', 'error');
          return;
        }
        showToast('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch {
      showToast('Network error', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error || 'Delete failed', 'error');
        return;
      }
      showToast('Category deleted successfully');
      fetchCategories();
    } catch {
      showToast('Network error', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 bg-[#060814] h-[calc(100vh-4rem)] p-8 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Forbidden: Admin access only.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#060814] h-[calc(100vh-4rem)] p-8 text-slate-100 overflow-y-auto relative select-none">
      
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
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">Category Management</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Create and organize credential categories to structure folder permissions
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-2 shadow-[0_2px_4px_rgba(37,99,235,0.15)] border border-[#3b82f6]/10 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Category
        </button>
      </div>

      {/* Stats Summary Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[28px] font-bold text-white font-mono leading-none">{categories.length}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Total Categories</p>
          </div>
        </div>
        <div className="bg-[#09101f] border border-[#16253d] rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <p className="text-[28px] font-bold text-white font-mono leading-none">Admin</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Access Control Owner</p>
          </div>
        </div>
      </div>

      {/* Categories Table Grid */}
      <div className="bg-[#09101f] border border-[#16253d] rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-[#111c2e] flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-white">Folder Categories</h2>
          <span className="text-[11px] text-slate-500">{categories.length} total</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No categories created yet. Click "Create Category" to get started.
          </div>
        ) : (
          <div className="divide-y divide-[#0f1c2e]">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#0a1120]/50 transition-colors gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-[14px] font-semibold text-white block truncate">{cat.name}</span>
                  {cat.description && (
                    <span className="text-[12px] text-slate-400 block mt-0.5 truncate">{cat.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="px-3 py-1.5 bg-[#1a2d1a] hover:bg-[#1e3a1e] text-emerald-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-emerald-900/30"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="px-3 py-1.5 bg-[#2d1a1a] hover:bg-[#3a1e1e] text-rose-400 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-rose-900/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-md rounded-xl p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-[16px] font-bold text-white mb-5 font-sans">
              {editingCategory ? '✏️ Edit Category' : '➕ Create New Category'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Category Name *</label>
                <input
                  type="text" required value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Social Media, Hosting, Databases"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe folder category purpose..."
                  rows={3}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-60"
              >
                {formSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
