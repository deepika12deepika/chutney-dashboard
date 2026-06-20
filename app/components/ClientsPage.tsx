'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Client {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  category: string;
  priority: string;
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
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formCategory, setFormCategory] = useState('Website Development');
  const [formPriority, setFormPriority] = useState('MEDIUM');
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
      month: '2-digit', day: '2-digit', year: 'numeric',
    });
  };

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      showToast('Unable to load clients', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: formClientName,
          clientEmail: formClientEmail,
          clientPhone: formClientPhone,
          category: formCategory,
          priority: formPriority,
          startDate: formStartDate,
          endDate: formEndDate,
          reason: formReason,
        }),
      });

      if (!res.ok) throw new Error();
      showToast('Client added successfully');
      setIsAddOpen(false);
      fetchClients();
    } catch {
      showToast('Failed to save client', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ... (Rest of your UI code stays exactly the same as you provided)
  // Just ensure the table row maps: {client.clientPhone} correctly.
  
  return (
     <div className="flex-1 bg-[#060814] min-h-screen p-8 text-slate-200">
        {/* Your existing JSX remains the same */}
        {/* Make sure in your Table <td>: */}
        {/* <td>{client.clientPhone}</td> */}
     </div>
  );
};

export default ClientsPage;