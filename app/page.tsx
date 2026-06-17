'use client';

import React, { useState, useEffect } from 'react';
import { Todo } from './types/todo';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTodos = localStorage.getItem('dashboard_credentials');
    if (savedTodos) {
      try { setTodos(JSON.parse(savedTodos)); } catch (e) { console.error(e); }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('dashboard_credentials', JSON.stringify(todos));
    }
  }, [todos, isLoading]);

  const handleAddTodo = (title: string, priority: 'low' | 'medium' | 'high', dueDate: string, platform: string, clientName: string) => {
    const newCredential: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      dueDate: dueDate || undefined,
      platform,
      clientName
    };
    setTodos((prev) => [newCredential, ...prev]);
  };

  const handleToggleComplete = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEditTodo = (id: string, newTitle: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
  };

  const totalCredentials = todos.length;
  const activeCredentials = todos.filter(t => !t.completed).length;
  const uniqueClients = Array.from(new Set(todos.map(t => t.clientName))).length;
  const uniquePlatforms = Array.from(new Set(todos.map(t => t.platform))).length;

  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) || todo.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'completed' && todo.completed) || (filter === 'pending' && !todo.completed);
    const matchesClient = clientFilter === 'all' || todo.clientName === clientFilter;
    return matchesSearch && matchesFilter && matchesClient;
  });

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 hidden lg:flex flex-col bg-[#0d1527] border-r border-slate-800 p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">C</div>
          <span className="text-lg font-bold tracking-wider text-white">Chutney App</span>
        </div>
        <nav className="space-y-1 flex-1">
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-blue-600/10 text-blue-400">📊 Dashboard</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">📁 Projects</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Task</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">👥 User storage</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Chat</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">🔑 Social setup</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Google calendar</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Daily News</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">🔑 Crendentials</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Attendence</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Requests</a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"> Clients</a>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-6 lg:px-10 py-8 overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Credentials Management</h1>
            <p className="text-xs text-slate-400 mt-1">Securely manage all client platform credentials</p>
          </div>
        </header>

        {/* 4 CARDS MATRIX GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-purple-950/40 border border-purple-500/20 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Total Credentials</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{totalCredentials}</h3>
            </div>
            <span className="text-2xl bg-purple-500/10 p-2 rounded-lg">🔑</span>
          </div>

          <div className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Active</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{activeCredentials}</h3>
            </div>
            <span className="text-2xl bg-emerald-500/10 p-2 rounded-lg">✅</span>
          </div>

          <div className="p-4 bg-blue-950/40 border border-blue-500/20 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Clients</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{uniqueClients}</h3>
            </div>
            <span className="text-2xl bg-blue-500/10 p-2 rounded-lg">💼</span>
          </div>

          <div className="p-4 bg-orange-950/40 border border-orange-500/20 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">Platforms</p>
              <h3 className="text-3xl font-bold mt-1 text-white">{uniquePlatforms}</h3>
            </div>
            <span className="text-2xl bg-orange-500/10 p-2 rounded-lg">🌐</span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* FILTERS */}
            <div className="bg-[#0d1527] p-4 rounded-xl border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="🔍 Search credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-slate-900 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-800">
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {(['all', 'pending', 'completed'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`text-xs px-3 py-1.5 font-medium rounded-md capitalize transition-all ${filter === type ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {type === 'pending' ? 'Active' : type === 'completed' ? 'Inactive' : 'All'}
                    </button>
                  ))}
                </div>

                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none"
                >
                  <option value="all">All Clients</option>
                  <option value="Client A">TechCorp</option>
                  <option value="Client B">DeltaAgency</option>
                  <option value="Client C">Personal Project</option>
                </select>
              </div>
            </div>

            {/* LIST STREAM */}
            <div className="space-y-3">
              {filteredTodos.length > 0 ? (
                filteredTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTodo}
                    onEdit={handleEditTodo}
                  />
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl border-slate-800 bg-[#0d1527]/30">
                  <span className="text-4xl block mb-3">🔑</span>
                  <h3 className="text-sm font-semibold text-slate-300">No credentials found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or add new credentials.</p>
                </div>
              )}
            </div>
          </div>

          {/* FORM AREA */}
          <div className="lg:col-span-1">
            <TodoForm onAddTodo={handleAddTodo} />
          </div>
        </div>

      </main>
    </div>
  );
}