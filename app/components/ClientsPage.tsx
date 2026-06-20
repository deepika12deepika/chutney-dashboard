'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Client {
  id: number;
  clientName: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
}

interface ClientsPageProps {
  currentUser: any;
}

const ClientsPage: React.FC<ClientsPageProps> = ({ currentUser }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [formClientName, setFormClientName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        showToast('Failed to load clients', 'error');
        return;
      }
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      showToast('Unable to load clients', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const openAddModal = () => {
    setFormClientName('');
    setFormStartDate('');
    setFormEndDate('');
    setFormReason('');
    setIsAddOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim() || !formStartDate || !formEndDate || !formReason.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (new Date(formStartDate) > new Date(formEndDate)) {
      showToast('Start date cannot be after End date', 'error');
      return;
    }

    setFormSubmitting(true);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formClientName.trim(),
          startDate: formStartDate,
          endDate: formEndDate,
          reason: formReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Failed to add client', 'error');
        return;
      }

      showToast('Client created successfully');
      setIsAddOpen(false);
      fetchClients();
    } catch {
      showToast('Network error execution failure', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-200 overflow-y-auto flex flex-col relative select-none">
      
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-semibold text-xs tracking-wide border backdrop-blur-xl flex items-center gap-3 transition-all ${
          toastType === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/20 text-rose-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${toastType === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
          {toastMessage}
        </div>
      )}

      <div className="bg-gradient-to-r from-[#0d122b] to-[#080b18] border border-[#161f42] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Clients Management</h1>
          <p className="text-slate-400 text-xs mt-1">Configure active project lifecycles, enterprise targets, and timeline tracking indicators.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_4px_20px_rgba(37,99,235,0.25)] border border-blue-400/20 active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          Add Client Profile
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="p-5 bg-[#0a0e24] border border-[#161f42] rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-blue-500">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Clients</p>
            <p className="text-2xl font-bold text-white mt-1">{clients.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg">📁</div>
        </div>

        <div className="p-5 bg-[#0a0e24] border border-[#161f42] rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-amber-500">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Latest Account</p>
            <p className="text-xs font-semibold text-white mt-2 max-w-[140px] truncate">{clients[0]?.clientName || 'No Data'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">⏱</div>
        </div>

        <div className="p-5 bg-[#0a0e24] border border-[#161f42] rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-emerald-500">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Active Pipelines</p>
            <p className="text-xs font-semibold text-emerald-400 mt-2 font-mono">{clients[0] ? formatDate(clients[0].startDate) : '—'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">⚙️</div>
        </div>

        <div className="p-5 bg-[#0a0e24] border border-[#161f42] rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-rose-500">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Target Closure</p>
            <p className="text-xs font-semibold text-rose-400 mt-2 font-mono">{clients[0] ? formatDate(clients[0].endDate) : '—'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-lg">⚠️</div>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Active Client Profiles</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-semibold bg-[#0a0e24] border border-[#161f42] rounded-2xl shadow-inner">
            No active client records mapped inside the terminal cluster.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clients.map((client) => (
              <div key={client.id} className="bg-[#0a0e24] border border-[#161f42] rounded-2xl p-5 flex flex-col justify-between hover:border-[#223163] hover:shadow-[0_4px_25px_rgba(0,0,0,0.4)] transition-all duration-200">
                <div>
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#141b3a]">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-bold text-white truncate">{client.clientName}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Reference Instance: #{client.id}</p>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md shrink-0 uppercase">
                      Operational
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4 bg-[#060814] p-3 rounded-xl border border-[#121936] font-mono text-[11px]">
                    <div>
                      <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Start Date</span>
                      <span className="text-emerald-400 font-semibold">{formatDate(client.startDate)}</span>
                    </div>
                    <div className="border-l border-[#141b3a] pl-3">
                      <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">End Target</span>
                      <span className="text-rose-400 font-semibold">{formatDate(client.endDate)}</span>
                    </div>
                  </div>

                  <div className="bg-[#070b1e]/50 border border-[#121835]/40 p-3 rounded-xl min-h-[64px]">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {client.reason}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#141b3a] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="uppercase tracking-wider font-bold text-[9px] text-slate-600">Pipeline Registry</span>
                  <span>Registered: {new Date(client.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0e24] border border-[#161f42] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
            
            <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">
              Create Client Framework Record
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-[11px] font-semibold text-slate-400">
              <div>
                <label className="block mb-1.5 text-slate-400">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  placeholder="e.g. Acme Space Intelligence"
                  className="w-full bg-[#060814] border border-[#161f42] text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-normal transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-slate-400">Operation Launch *</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-[#060814] border border-[#161f42] text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs text-slate-400"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-slate-400">Operation End *</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-[#060814] border border-[#161f42] text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-xs text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-slate-400">Operational Purpose Scope *</label>
                <textarea
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Describe framework tasks, targets, and goals..."
                  rows={4}
                  className="w-full bg-[#060814] border border-[#161f42] text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-normal resize-none leading-relaxed"
                />
              </div>
              
              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] cursor-pointer disabled:opacity-40"
              >
                {formSubmitting ? 'Syncing...' : 'Save Record Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;