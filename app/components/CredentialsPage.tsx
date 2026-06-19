'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Credential, SessionUser, Category } from '../types/credential';

interface CredentialsPageProps {
  currentUser: SessionUser;
}

const DEFAULT_PLATFORMS = [
  'None', 'GitHub', 'Vercel', 'Supabase', 'Google Cloud',
  'Azure', 'Heroku', 'Netlify', 'Cloudflare', 'DigitalOcean',
  'Shopify', 'WordPress', 'Stripe', 'SendGrid', 'Mailchimp',
  'Slack', 'Zoom', 'Trello', 'Figma', 'Notion',
];

const CredentialsPage: React.FC<CredentialsPageProps> = ({ currentUser }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPasswordMap, setShowPasswordMap] = useState<{ [key: string]: boolean }>({});

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState(DEFAULT_PLATFORMS[0]);
  const [formClient, setFormClient] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [platforms, setPlatforms] = useState<{ id: number; name: string }[]>([]);
  const [isAddPlatformOpen, setIsAddPlatformOpen] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [isCreatingPlatform, setIsCreatingPlatform] = useState(false);

  // Security verification modal
  const [verificationCredId, setVerificationCredId] = useState<string | null>(null);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const isAdmin = currentUser.role === 'Admin';
  // const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'Manager';
  
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdCategory = data.category;
        showToast('Category created successfully');
        
        // Refresh categories list
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
        
        // Select the newly created category
        if (createdCategory) {
          setFormCategoryId(createdCategory.id);
        }
        
        setIsAddCategoryOpen(false);
        setNewCategoryName('');
        setNewCategoryDesc('');
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to create category', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreatePlatformSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;
    setIsCreatingPlatform(true);
    try {
      const res = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlatformName }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdPlatform = data.platform;
        showToast('Platform created successfully');
        
        // Refresh platforms list
        const platRes = await fetch('/api/platforms');
        if (platRes.ok) {
          const platData = await platRes.json();
          setPlatforms(platData.platforms || []);
        }
        
        // Select the newly created platform
        if (createdPlatform) {
          setFormPlatform(createdPlatform.name);
        }
        
        setIsAddPlatformOpen(false);
        setNewPlatformName('');
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to create platform', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIsCreatingPlatform(false);
    }
  };

  const fetchCredentials = useCallback(async () => {
    setIsLoading(true);
    try {
      const [credRes, catRes, platRes] = await Promise.all([
        fetch('/api/credentials'),
        fetch('/api/categories'),
        fetch('/api/platforms'),
      ]);
      const credData = await credRes.json();
      const catData = await catRes.json();
      const platData = await platRes.json();
      setCredentials(credData.credentials || []);
      setCategories(catData.categories || []);
      setPlatforms(platData.platforms || []);
    } catch {
      showToast('Failed to load credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
  };

  const togglePasswordVisibility = (id: string) => {
    const isVisible = showPasswordMap[id] || false;
    if (isVisible) {
      setShowPasswordMap((prev) => ({ ...prev, [id]: false }));
    } else {
      setVerificationCredId(id);
      setVerificationPassword('');
      setVerificationError(null);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: verificationPassword }),
      });

      if (res.ok) {
        if (verificationCredId) {
          setShowPasswordMap((prev) => ({ ...prev, [verificationCredId]: true }));
          setVerificationCredId(null);
          showToast('Password revealed successfully');
        }
      } else {
        setVerificationError('Incorrect password. Access denied.');
      }
    } catch {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const openAddModal = () => {
    setEditingCredential(null);
    setFormTitle('');
    setFormPlatform(platforms[0]?.name || DEFAULT_PLATFORMS[0]);
    setFormClient('');
    setFormUsername('');
    setFormPassword('');
    setFormStatus('active');
    setFormNotes('');
    setFormCategoryId('');
    setIsAddOpen(true);
  };

  const openEditModal = (cred: Credential) => {
    setEditingCredential(cred);
    setFormTitle(cred.title);
    setFormPlatform(cred.platform || (platforms[0]?.name || DEFAULT_PLATFORMS[0]));
    setFormClient(cred.clientName || '');
    setFormUsername(cred.username);
    setFormPassword(cred.password || '');
    setFormStatus(cred.status);
    setFormNotes(cred.notes || '');
    setFormCategoryId(cred.categoryId ?? '');
    setIsAddOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUsername.trim() || !formPassword.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    setFormSubmitting(true);

    const payload = {
      title: formTitle,
      platform: formPlatform,
      clientName: formClient,
      username: formUsername,
      password: formPassword,
      status: formStatus,
      notes: formNotes,
      categoryId: formCategoryId || null,
    };

    try {
      if (editingCredential) {
        const res = await fetch(`/api/credentials/${editingCredential.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Update failed', 'error');
          return;
        }
        showToast('Credential updated successfully');
      } else {
        const res = await fetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          showToast(d.error || 'Create failed', 'error');
          return;
        }
        showToast('Credential added successfully');
      }

      setIsAddOpen(false);
      fetchCredentials();
    } catch {
      showToast('Network error', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (cred: Credential) => {
    if (!confirm(`Delete credential "${cred.title}"?`)) return;
    try {
      const res = await fetch(`/api/credentials/${cred.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Delete failed', 'error');
        return;
      }
      showToast('Credential deleted');
      fetchCredentials();
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Filtering
  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cred.platform || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && cred.status === 'active') ||
      (activeTab === 'inactive' && cred.status === 'inactive');

    const matchesCategory =
      selectedCategory === 'all' ||
      String(cred.categoryId) === selectedCategory;

    return matchesSearch && matchesTab && matchesCategory;
  });

  const totalCount = credentials.length;
  const activeCount = credentials.filter((c) => c.status === 'active').length;
  const uniqueClients = new Set(credentials.map((c) => c.clientName).filter(Boolean)).size;
  const uniquePlatforms = new Set(credentials.map((c) => c.platform).filter(Boolean)).size;

  return (
    <div className="flex-1 bg-[#060814] h-[calc(100vh-4rem)] p-8 text-slate-100 overflow-y-auto flex flex-col relative select-none">

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">Credentials Management</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            {isAdmin ? 'Securely manage all client platform credentials' : 'View credentials you have access to'}
          </p>
        </div>
        {isAdmin && (
          <button
            id="add-credential-btn"
            onClick={openAddModal}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-2 shadow-[0_2px_4px_rgba(37,99,235,0.15)] border border-[#3b82f6]/10 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Credential
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-[#a855f7] to-[#7c3aed] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{totalCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100/80 mt-1">Total Credentials</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-[20px] h-[20px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778z" />
              <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{activeCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80 mt-1">Active</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{uniqueClients}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/80 mt-1">Clients</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{uniquePlatforms}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100/80 mt-1">Platforms</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#09101f] p-4 rounded-xl border border-[#16253d] mb-6 flex flex-col gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050912] border border-[#172740] text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2 text-[13px] rounded-lg focus:outline-none focus:border-blue-500/80 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#121f35]">
          <div className="flex bg-[#050912] p-[3px] rounded-lg border border-[#172740]">
            {(['all', 'active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] px-3.5 py-1.5 font-bold rounded-md uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === tab ? 'bg-[#2563eb] text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-[11px] bg-[#050912] border border-[#172740] rounded-lg text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Credentials Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <svg className="w-8 h-8 text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : filteredCredentials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCredentials.map((cred) => {
              const showPass = showPasswordMap[cred.id] || false;
              return (
                <div key={cred.id} className="bg-[#09101f] border border-[#16253d] p-5 rounded-xl hover:border-[#203657] transition-all flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-[14.5px] font-bold text-white truncate leading-snug">{cred.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-semibold">{cred.clientName || 'No client'}</span>
                          {cred.categoryName && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1a2d4a] text-blue-400 border border-blue-900/30 uppercase tracking-wider">
                              {cred.categoryName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                        cred.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700/50'
                      }`}>
                        {cred.status}
                      </span>
                    </div>

                    {cred.platform && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 font-medium">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
                        </svg>
                        Platform: <strong className="text-slate-300">{cred.platform}</strong>
                      </div>
                    )}

                    <div className="space-y-2.5 bg-[#050912]/80 border border-[#121f35] p-3 rounded-lg">
                      {/* Username */}
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Username / Email</span>
                          <span className="text-slate-200 truncate block font-medium mt-0.5">{cred.username}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(cred.username, 'Username')}
                          className="p-1.5 hover:bg-[#121c2e]/50 rounded text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                          title="Copy Username"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between text-xs gap-2 pt-2 border-t border-[#111c2e]">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Password</span>
                          <span className="text-slate-200 block font-mono mt-0.5 text-sm tracking-wide font-medium">
                            {showPass ? cred.password : '••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePasswordVisibility(cred.id)}
                            className="p-1.5 hover:bg-[#121c2e]/50 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title={showPass ? 'Hide Password' : 'Show Password'}
                          >
                            {showPass ? (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                          {showPass && (
                            <button
                              onClick={() => copyToClipboard(cred.password || '', 'Password')}
                              className="p-1.5 hover:bg-[#121c2e]/50 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Copy Password"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {cred.notes && (
                      <div className="mt-3 text-[11px] text-slate-500 bg-[#050912]/30 px-2.5 py-1.5 rounded border border-[#16253d]/40">
                        <span className="font-semibold text-slate-400 block mb-0.5">Notes:</span>
                        <p className="line-clamp-2 leading-relaxed">{cred.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions — admin only */}
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-3 border-t border-[#121f35] pt-3 mt-4 text-xs font-semibold select-none">
                      <button
                        onClick={() => openEditModal(cred)}
                        className="text-[#2563eb] hover:text-[#3b82f6] cursor-pointer hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cred)}
                        className="text-[#ef4444] hover:text-[#f87171] cursor-pointer hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed rounded-xl border-[#16253d] bg-[#09101f]/20">
            <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778z" />
            </svg>
            <h3 className="text-[17px] font-semibold text-slate-300">
              {isLoading ? 'Loading...' : 'No credentials found'}
            </h3>
            <p className="text-[12px] text-slate-500 mt-1 max-w-sm text-center">
              {isAdmin
                ? 'Add your first credential using the button above'
                : 'Contact an admin to grant you access to credential categories'}
            </p>
          </div>
        )}
      </div>

      {/* Security Verification Modal */}
      {verificationCredId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-rose-500/20 w-full max-w-sm rounded-xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.08)] relative">
            <button onClick={() => setVerificationCredId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Security Verification</h3>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Confirm Your Identity</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 font-semibold mb-4 leading-relaxed bg-[#050912]/40 border border-[#16253d] p-3 rounded-lg">
              Enter your account password for <strong className="text-blue-400">{currentUser.name} ({currentUser.role})</strong> to reveal this password.
            </p>
            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter your login password"
                  value={verificationPassword}
                  onChange={(e) => { setVerificationPassword(e.target.value); setVerificationError(null); }}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-rose-500/80 font-mono tracking-wide"
                />
                {verificationError && (
                  <span className="text-rose-500 text-[10px] block mt-1 font-bold">⚠️ {verificationError}</span>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setVerificationCredId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-60"
                >
                  {isVerifying ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-md rounded-xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-white mb-4 shrink-0">
              {editingCredential ? '✏️ Edit Platform Credential' : '➕ Add New Platform Credential'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Credential Title *</label>
                <input
                  type="text" required placeholder="e.g. Production Database Key"
                  value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Platform</label>
                  <select
                    value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    <option value="">Select Platform</option>
                    {platforms.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAddPlatformOpen(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 mt-1 cursor-pointer inline-block"
                    >
                      + Add New Platform
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Category</label>
                  <select
                    value={String(formCategoryId)} onChange={(e) => setFormCategoryId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    <option value="">None</option>
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 mt-1 cursor-pointer inline-block"
                    >
                      + Add New Category
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Client Name</label>
                <input
                  type="text" placeholder="e.g. TechCorp"
                  value={formClient} onChange={(e) => setFormClient(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Username / Email *</label>
                <input
                  type="text" required placeholder="e.g. admin@example.com"
                  value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Password *</label>
                <input
                  type="text" required placeholder="Password value"
                  value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm tracking-wide"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                <select
                  value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notes (Optional)</label>
                <textarea
                  placeholder="URL, configs, or additional info"
                  value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-60"
              >
                {formSubmitting ? 'Saving...' : editingCredential ? 'Save Changes' : 'Create Credential'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-sm rounded-xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h4 className="text-[14px] font-bold text-white mb-4">➕ Add New Category</h4>
            <form onSubmit={handleCreateCategorySubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Analytics, Social Media"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Brief description"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingCategory}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer"
              >
                {isCreatingCategory ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Platform Modal */}
      {isAddPlatformOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-sm rounded-xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddPlatformOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h4 className="text-[14px] font-bold text-white mb-4">➕ Add New Platform</h4>
            <form onSubmit={handleCreatePlatformSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Platform Name *</label>
                <input
                  type="text"
                  required
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  placeholder="e.g. GitLab, Salesforce"
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={isCreatingPlatform}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer"
              >
                {isCreatingPlatform ? 'Creating...' : 'Create Platform'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CredentialsPage;
