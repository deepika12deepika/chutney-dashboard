'use client';

import React, { useState } from 'react';

interface TodoFormProps {
  onAddTodo: (title: string, priority: 'low' | 'medium' | 'high', dueDate: string, platform: string, clientName: string) => void;
}

export default function TodoForm({ onAddTodo }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [platform, setPlatform] = useState('AWS');
  const [client, setClient] = useState('Client A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAddTodo(title, priority, dueDate, platform, client);
    setTitle('');
    setPriority('medium');
    setDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">➕ Add New Platform Credential</h3>
      
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Credential Name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Production Database Key"
          className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Platform Category</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AWS">☁️ AWS Cloud</option>
            <option value="GitHub">🐙 GitHub Ent</option>
            <option value="Vercel">▲ Vercel Hosting</option>
            <option value="Supabase">⚡ Supabase DB</option>
            <option value="Neon">🦄 Neon DB</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Assign Client</label>
          <select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Client A">Client: TechCorp</option>
            <option value="Client B">Client: DeltaAgency</option>
            <option value="Client C">Client: Personal Project</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Priority Level</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 Critical / High</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Expiry Date (Optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-800 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors shadow-lg"
      >
        🚀 Generate Platform Entry
      </button>
    </form>
  );
}