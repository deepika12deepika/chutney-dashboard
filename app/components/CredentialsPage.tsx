'use client';

import React, { useState, useEffect } from 'react';
import { Credential, UserProfile } from '../types/credential';

interface CredentialsPageProps {
  credentials: Credential[];
  currentUser: UserProfile;
  onAddCredential: (cred: Omit<Credential, 'id' | 'createdAt'>) => void;
  onUpdateCredential: (id: string, updated: Partial<Credential>) => void;
  onDeleteCredential: (id: string) => void;
}

const DEFAULT_CLIENTS = [
  'TechCorp',
  'DeltaAgency',
  'Personal Project',
  'Avora',
  'Chutney Agency',
  'Acme Inc',
  'Stark Industries',
  'Wayne Enterprises',
  'Globex Corporation',
  'Initech',
  'Umbrella Corp'
];

const DEFAULT_PLATFORMS = [
  'AWS', 'GitHub', 'Vercel', 'Supabase', 'Google Cloud',
  'Azure', 'Heroku', 'Netlify', 'Cloudflare', 'DigitalOcean',
  'Shopify', 'WordPress', 'Stripe', 'SendGrid', 'Mailchimp',
  'Slack', 'Zoom', 'Trello'
];

const CredentialsPage: React.FC<CredentialsPageProps> = ({
  credentials,
  currentUser,
  onAddCredential,
  onUpdateCredential,
  onDeleteCredential
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedClient, setSelectedClient] = useState('All Clients');
  const [showPasswordMap, setShowPasswordMap] = useState<{ [key: string]: boolean }>({});
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageClientsOpen, setIsManageClientsOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

  // Client Management State
  const [clients, setClients] = useState<string[]>([]);
  const [newClientName, setNewClientName] = useState('');

  // Add/Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPlatform, setFormPlatform] = useState('AWS');
  const [formClient, setFormClient] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');

  // Security Verification Modal State
  const [verificationCredId, setVerificationCredId] = useState<string | null>(null);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize clients from localStorage or default list
  useEffect(() => {
    const savedClients = localStorage.getItem('dashboard_clients');
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch (e) {
        setClients(DEFAULT_CLIENTS);
      }
    } else {
      setClients(DEFAULT_CLIENTS);
      localStorage.setItem('dashboard_clients', JSON.stringify(DEFAULT_CLIENTS));
    }
  }, []);

  const saveClients = (updatedClients: string[]) => {
    setClients(updatedClients);
    localStorage.setItem('dashboard_clients', JSON.stringify(updatedClients));
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    if (clients.includes(newClientName.trim())) {
      showToast('Client already exists!');
      return;
    }
    const updated = [...clients, newClientName.trim()];
    saveClients(updated);
    setNewClientName('');
    showToast('Client added successfully');
  };

  const handleDeleteClient = (clientToDelete: string) => {
    if (confirm(`Are you sure you want to delete client "${clientToDelete}"? This will not delete their credentials, but will remove them from the clients list.`)) {
      const updated = clients.filter(c => c !== clientToDelete);
      saveClients(updated);
      showToast('Client deleted');
    }
  };

  // Set default client on add modal open
  useEffect(() => {
    if (clients.length > 0 && !formClient) {
      setFormClient(clients[0]);
    }
  }, [clients, formClient]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Open add modal
  const openAddModal = () => {
    setEditingCredential(null);
    setFormTitle('');
    setFormPlatform(DEFAULT_PLATFORMS[0]);
    setFormClient(clients[0] || '');
    setFormUsername('');
    setFormPassword('');
    setFormStatus('active');
    setFormNotes('');
    setIsAddOpen(true);
  };

  // Open edit modal
  const openEditModal = (cred: Credential) => {
    setEditingCredential(cred);
    setFormTitle(cred.title);
    setFormPlatform(cred.platform);
    setFormClient(cred.clientName);
    setFormUsername(cred.username);
    setFormPassword(cred.password || '');
    setFormStatus(cred.status);
    setFormNotes(cred.notes || '');
    setIsAddOpen(true);
  };

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUsername.trim() || !formPassword.trim()) {
      showToast('Please fill out all required fields');
      return;
    }

    const payload = {
      title: formTitle,
      platform: formPlatform,
      clientName: formClient,
      username: formUsername,
      password: formPassword,
      status: formStatus,
      notes: formNotes
    };

    if (editingCredential) {
      onUpdateCredential(editingCredential.id, payload);
      showToast('Credential updated successfully');
    } else {
      onAddCredential(payload);
      showToast('Credential added successfully');
    }

    setIsAddOpen(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
  };

  // Triggered when toggling eye icon
  const togglePasswordVisibility = (id: string) => {
    const isCurrentlyVisible = showPasswordMap[id] || false;
    if (isCurrentlyVisible) {
      // Hide instantly without verification
      setShowPasswordMap(prev => ({
        ...prev,
        [id]: false
      }));
    } else {
      // Trigger confirmation dialog
      setVerificationCredId(id);
      setVerificationPassword('');
      setVerificationError(null);
    }
  };

  // Handle password verification submit
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationPassword === currentUser.password) {
      if (verificationCredId) {
        setShowPasswordMap(prev => ({
          ...prev,
          [verificationCredId]: true
        }));
        setVerificationCredId(null);
        showToast('Password revealed successfully');
      }
    } else {
      setVerificationError('Incorrect password. Access denied.');
    }
  };

  // Filtering Logic
  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && cred.status === 'active') ||
      (activeTab === 'inactive' && cred.status === 'inactive');

    const matchesClient =
      selectedClient === 'All Clients' ||
      cred.clientName === selectedClient;

    return matchesSearch && matchesTab && matchesClient;
  });

  // Calculate dynamic stats
  const totalCount = credentials.length;
  const activeCount = credentials.filter(c => c.status === 'active').length;
  
  // Clients count is total clients in management system + any additional custom clients in credentials
  const uniqueCredentialClients = Array.from(new Set(credentials.map(c => c.clientName)));
  const allUniqueClients = Array.from(new Set([...clients, ...uniqueCredentialClients]));
  const clientCount = allUniqueClients.length || DEFAULT_CLIENTS.length;

  // Platforms count is total unique platforms
  const uniqueCredentialPlatforms = Array.from(new Set(credentials.map(c => c.platform)));
  const allUniquePlatforms = Array.from(new Set([...DEFAULT_PLATFORMS, ...uniqueCredentialPlatforms]));
  const platformCount = allUniquePlatforms.length || DEFAULT_PLATFORMS.length;

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-100 overflow-y-auto flex flex-col relative select-none z-10">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#16a34a] text-white px-5 py-3 rounded-lg shadow-2xl font-medium text-sm border border-[#22c55e]/30 flex items-center gap-2 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px] font-sans">Credentials Management</h1>
          <p className="text-[13px] text-slate-400 mt-1 tracking-[0.1px]">Securely manage all client platform credentials</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsManageClientsOpen(true)}
            className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-[13px] font-semibold rounded-md transition-colors duration-150 flex items-center gap-2 shadow-[0_2px_4px_rgba(22,163,74,0.1)] border border-[#22c55e]/10 cursor-pointer animate-in fade-in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-10.5h16.5M2.25 9h19.5M2.25 5.25h19.5" />
            </svg>
            Manage Clients
          </button>
          <button 
            onClick={openAddModal}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold rounded-md transition-colors duration-150 flex items-center gap-2 shadow-[0_2px_4px_rgba(37,99,235,0.15)] border border-[#3b82f6]/10 cursor-pointer animate-in fade-in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Credential
          </button>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Purple Card - Total Credentials */}
        <div className="p-5 bg-gradient-to-br from-[#a855f7] to-[#7c3aed] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{totalCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100/80 mt-1">Total Credentials</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-[20px] h-[20px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 12l.707-.707a3 3 0 1 1 4.243 4.243L16.24 16.24" />
              <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Green Card - Active */}
        <div className="p-5 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{activeCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80 mt-1">Active</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Blue Card - Clients */}
        <div className="p-5 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{clientCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/80 mt-1">Clients</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75H4.5a.75.75 0 0 1-.75-.75v-4.25m16.5 0a3 3 0 0 0-3-3H7.02a3 3 0 0 0-3 3m16.5 0h-16.5M12 3v3m0 0l-3-3m3 3l3-3" />
            </svg>
          </div>
        </div>

        {/* Orange Card - Platforms */}
        <div className="p-5 bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-xl flex justify-between items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-350" />
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{platformCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100/80 mt-1">Platforms</span>
          </div>
          <div className="w-11 h-11 bg-white/15 border border-white/10 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-[20px] h-[20px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.003 9.003 0 018.716 6.747M12 3a9.003 9.003 0 00-8.716 6.747" />
            </svg>
          </div>
        </div>

      </div>

      {/* Filters & Search Box Area */}
      <div className="bg-[#09101f] p-4 rounded-xl border border-[#16253d] mb-6 flex flex-col gap-3">
        {/* Search Input */}
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050912] border border-[#172740] text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2 text-[13px] rounded-lg focus:outline-none focus:border-blue-500/80 transition-all font-sans"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#121f35]">
          <div className="flex bg-[#050912] p-[3px] rounded-lg border border-[#172740]">
            {(['all', 'active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] px-3.5 py-1.5 font-bold rounded-md uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-[#2563eb] text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-1.5 text-[11px] bg-[#050912] border border-[#172740] rounded-lg text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 transition-colors font-medium font-sans"
          >
            <option value="All Clients">All Clients</option>
            {clients.map(clientName => (
              <option key={clientName} value={clientName}>{clientName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Credentials Stream */}
      <div className="flex-1 flex flex-col min-h-0">
        {filteredCredentials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            {filteredCredentials.map((cred) => {
              const showPass = showPasswordMap[cred.id] || false;
              return (
                <div key={cred.id} className="bg-[#09101f] border border-[#16253d] p-5 rounded-xl hover:border-[#203657] transition-all flex flex-col justify-between shadow-md">
                  <div>
                    {/* Top title and platform */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-[14.5px] font-bold text-white truncate leading-snug">{cred.title}</h3>
                        <span className="text-[11px] text-slate-500 font-semibold mt-0.5 inline-block">{cred.clientName}</span>
                      </div>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                        cred.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 border-slate-700/50'
                      }`}>
                        {cred.status}
                      </span>
                    </div>

                    {/* Platform metadata */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4 font-medium">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
                      </svg>
                      Platform: <strong className="text-slate-300">{cred.platform}</strong>
                    </div>

                    {/* Username & Password display */}
                    <div className="space-y-2.5 bg-[#050912]/80 border border-[#121f35] p-3 rounded-lg font-sans">
                      {/* Username Row */}
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

                      {/* Password Row */}
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
                        </div>
                      </div>
                    </div>

                    {/* Notes (if any) */}
                    {cred.notes && (
                      <div className="mt-3 text-[11px] text-slate-500 bg-[#050912]/30 px-2.5 py-1.5 rounded border border-[#16253d]/40">
                        <span className="font-semibold text-slate-400 block mb-0.5">Notes:</span>
                        <p className="line-clamp-2 leading-relaxed">{cred.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Edit/Delete Actions */}
                  <div className="flex items-center justify-end gap-3 border-t border-[#121f35] pt-3 mt-4 text-xs font-semibold select-none">
                    <button 
                      onClick={() => openEditModal(cred)}
                      className="text-[#2563eb] hover:text-[#3b82f6] cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete credential "${cred.title}"?`)) {
                          onDeleteCredential(cred.id);
                          showToast('Credential deleted successfully');
                        }
                      }}
                      className="text-[#ef4444] hover:text-[#f87171] cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Exact Empty State match with screenshot */
          <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed rounded-xl border-[#16253d] bg-[#09101f]/20 select-none">
            <svg className="w-16 h-16 text-slate-600 mb-4 animate-pulse rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 002-2V3a2 2 0 00-2-2h-1.5a2 2 0 00-2 2v6.5a5.5 5.5 0 106.5 6.5V9a2 2 0 00-2-2z" />
            </svg>
            <h3 className="text-[17px] font-semibold text-slate-300">No credentials found</h3>
            <p className="text-[12px] text-slate-500 mt-1 max-w-sm text-center font-sans">Try adjusting your filters or add new credentials</p>
          </div>
        )}
      </div>

      {/* Security Verification Modal (For viewing passwords) */}
      {verificationCredId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-rose-500/20 w-full max-w-sm rounded-xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.08)] relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setVerificationCredId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
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
                <h3 className="text-base font-bold text-white font-sans">Security Verification</h3>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Confirm Your Identity</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-semibold mb-4 leading-relaxed bg-[#050912]/40 border border-[#16253d] p-3 rounded-lg font-sans">
              Enter account password for <strong className="text-blue-400">{currentUser.name} ({currentUser.role})</strong> to reveal this password.
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Account Password *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder={`Hint: ${currentUser.name.toLowerCase()}123`}
                  value={verificationPassword}
                  onChange={(e) => {
                    setVerificationPassword(e.target.value);
                    setVerificationError(null);
                  }}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-rose-500/80 font-mono tracking-wide"
                />
                {verificationError && (
                  <span className="text-rose-500 text-[10px] block mt-1 font-bold">
                    ⚠️ {verificationError}
                  </span>
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Credential Modal (Glassmorphic) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingCredential ? '✏️ Edit Platform Credential' : '➕ Add New Platform Credential'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Credential Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Database Key"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Platform Category *</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    {DEFAULT_PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Assign Client *</label>
                  <select
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    {clients.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Username / Email *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin@example.com"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Password value"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm tracking-wide"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Status *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-[#050912] border border-[#172740] text-slate-200 px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer font-sans"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Notes / Description (Optional)</label>
                <textarea
                  placeholder="URL, configurations, or additional info"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#050912] border border-[#172740] text-slate-100 px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-bold rounded-lg transition-colors shadow-lg cursor-pointer"
              >
                {editingCredential ? 'Save Changes' : 'Generate Platform Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Clients Modal */}
      {isManageClientsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#09101f] border border-[#203657] w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            <button 
              onClick={() => setIsManageClientsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">🏢 Manage Clients List</h3>

            {/* Add client form */}
            <form onSubmit={handleAddClientSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                placeholder="New Client Name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="flex-1 bg-[#050912] border border-[#172740] text-slate-100 px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-blue-500 font-sans font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Clients List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border-t border-[#121f35] pt-3">
              {clients.map((client) => (
                <div key={client} className="flex justify-between items-center bg-[#050912]/50 px-3 py-2.5 rounded-lg border border-[#16253d]/50 text-xs font-semibold">
                  <span className="text-slate-200">{client}</span>
                  <button
                    onClick={() => handleDeleteClient(client)}
                    className="p-1 hover:bg-[#121c2e] rounded text-rose-500 hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete Client"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CredentialsPage;
