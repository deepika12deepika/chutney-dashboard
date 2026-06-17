'use client';

import React, { useState } from 'react';
import { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
}

export default function TodoItem({ todo, onToggleComplete, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(todo.id, editTitle);
      setIsEditing(false);
    }
  };

  const priorityColors = {
    low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md gap-4 hover:border-slate-700 transition-all ${todo.completed ? 'opacity-60' : ''}`}>
      
      <div className="flex items-start gap-4 flex-1">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo.id)}
          className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm bg-slate-800 border-slate-700 text-white"
              />
              <button onClick={handleSave} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-xs bg-slate-700 text-white px-2 py-1 rounded">Cancel</button>
            </div>
          ) : (
            <div>
              <p className={`text-sm font-medium ${todo.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {todo.title}
              </p>
              <div className="text-xs text-slate-400 mt-0.5 flex gap-2">
                <span>🖥️ Platform: <strong className="text-slate-300">{todo.platform}</strong></span>
                <span>•</span>
                <span>👤 Client: <strong className="text-slate-300">{todo.clientName}</strong></span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityColors[todo.priority]}`}>
              {todo.priority} Risk
            </span>
            {todo.dueDate && (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                📅 Sync Due: {todo.dueDate}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-xs font-medium text-blue-400 hover:underline">
            ✏️ Edit
          </button>
        )}
        <button onClick={() => onDelete(todo.id)} className="text-xs font-medium text-rose-400 hover:underline">
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}