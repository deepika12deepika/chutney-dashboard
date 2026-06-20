'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SessionUser, Employee, Task } from '../types/credential';

interface ProjectsPageProps {
  currentUser: SessionUser;
}

interface Client {
  id: number;
  name: string;
  companyName?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface Project {
  id: number;
  projectName: string;
  description?: string | null;
  status: 'Active' | 'On Hold' | 'Completed' | 'Cancelled' | 'Archived';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  startDate?: string | null;
  endDate?: string | null;
  projectManagerId?: number | null;
  projectManagerName?: string | null;
  clientId: number;
  clientName: string;
  companyName?: string | null;
  departmentsCount: number;
  tasksCount: number;
  progress: number;
}

interface ProjectMember {
  id: number;
  employeeId: number;
  name: string;
  email: string;
  role: string;
  roleInProject: string;
}

interface ProjectDepartment {
  id: number;
  departmentName: string;
  description?: string | null;
}

interface ProjectDeliverable {
  id: number;
  title: string;
  targetQuantity: number;
  completedQuantity: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate?: string | null;
  departmentId: number;
  departmentName: string;
}

interface ProjectFile {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedBy?: number | null;
  uploadedByName?: string | null;
  uploadedAt: string;
}

interface ProjectNote {
  id: number;
  note: string;
  createdBy?: number | null;
  createdByName?: string | null;
  createdAt: string;
}

const DEFAULTS_DEPARTMENTS = [
  'Social Media',
  'Website',
  'Graphic Design',
  'Video Editing',
  'SEO',
  'Performance Marketing',
  'Content Writing',
  'Accounts'
];

const ProjectsPage: React.FC<ProjectsPageProps> = ({ currentUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  // Selected Project (Detail view)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetail, setProjectDetail] = useState<{
    project: Project;
    members: ProjectMember[];
    departments: ProjectDepartment[];
    deliverables: ProjectDeliverable[];
    files: ProjectFile[];
    notes: ProjectNote[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'departments' | 'deliverables' | 'tasks'>('overview');
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isAddDeliverableModalOpen, setIsAddDeliverableModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Create Project Form State
  const [formClientId, setFormClientId] = useState<number | ''>('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<Project['status']>('Active');
  const [formPriority, setFormPriority] = useState<Project['priority']>('Medium');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formPMId, setFormPMId] = useState<number | ''>('');
  const [formSelectedMembers, setFormSelectedMembers] = useState<number[]>([]);
  const [formSelectedDepts, setFormSelectedDepts] = useState<string[]>([]);
  const [formCustomDept, setFormCustomDept] = useState('');
  const [showCustomDeptInput, setShowCustomDeptInput] = useState(false);

  // Add Client Form State (inline)
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Edit Project Form State
  const [editFormName, setEditFormName] = useState('');
  const [editFormDesc, setEditFormDesc] = useState('');
  const [editFormStatus, setEditFormStatus] = useState<Project['status']>('Active');
  const [editFormPriority, setEditFormPriority] = useState<Project['priority']>('Medium');
  const [editFormStart, setEditFormStart] = useState('');
  const [editFormEnd, setEditFormEnd] = useState('');
  const [editFormPMId, setEditFormPMId] = useState<number | ''>('');
  const [editFormClientId, setEditFormClientId] = useState<number | ''>('');

  // Add Member Form
  const [memberFormEmpId, setMemberFormEmpId] = useState<number | ''>('');
  const [memberFormRole, setMemberFormRole] = useState('');

  // Add Department Form
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormDesc, setDeptFormDesc] = useState('');

  // Add Deliverable Form
  const [delivFormTitle, setDelivFormTitle] = useState('');
  const [delivFormDeptId, setDelivFormDeptId] = useState<number | ''>('');
  const [delivFormTarget, setDelivFormTarget] = useState(1);
  const [delivFormDue, setDelivFormDue] = useState('');

  // Edit Deliverable Form State
  const [isEditDeliverableModalOpen, setIsEditDeliverableModalOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<ProjectDeliverable | null>(null);
  const [editDelivTitle, setEditDelivTitle] = useState('');
  const [editDelivDeptId, setEditDelivDeptId] = useState<number | ''>('');
  const [editDelivTarget, setEditDelivTarget] = useState(1);
  const [editDelivCompleted, setEditDelivCompleted] = useState(0);
  const [editDelivStatus, setEditDelivStatus] = useState<ProjectDeliverable['status']>('Pending');
  const [editDelivDue, setEditDelivDue] = useState('');

  // Add Task Form
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormAssignTo, setTaskFormAssignTo] = useState<number | ''>('');
  const [taskFormDeptId, setTaskFormDeptId] = useState<number | ''>('');
  const [taskFormPriority, setTaskFormPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [taskFormDue, setTaskFormDue] = useState('');

  // Note/File form
  const [noteContent, setNoteContent] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const isAdmin = currentUser.role === 'Admin';
  const isManager = currentUser.role === 'Manager';
  const isEmployee = currentUser.role === 'Employee';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }

      // Fetch client list
      const clientRes = await fetch('/api/clients');
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClients(clientData.clients || []);
      }

      // Fetch employee list (for assignments)
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
    } catch {
      showToast('Failed to load projects metadata', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchProjectDetails = useCallback(async (projectId: number) => {
    setIsDetailLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectDetail(data);

        // Fetch tasks
        const tasksRes = await fetch('/api/tasks');
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          // Filter tasks specifically for this project
          const filtered = (tasksData.tasks || []).filter((t: Task) => (t as any).projectId === projectId);
          setProjectTasks(filtered);
        }
      } else {
        showToast('Failed to load project details', 'error');
      }
    } catch {
      showToast('Network error loading details', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const handleProjectClick = (projectId: number) => {
    setSelectedProjectId(projectId);
    setActiveTab('overview');
    fetchProjectDetails(projectId);
  };

  const handleCloseDetail = () => {
    setSelectedProjectId(null);
    setProjectDetail(null);
    setProjectTasks([]);
    fetchProjects(); // Refresh lists
  };

  const handleAddClientInline = async () => {
    if (!newClientName.trim()) {
      showToast('Client name is required', 'error');
      return;
    }
    setIsSavingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName.trim(),
          companyName: newClientCompany.trim(),
          email: newClientEmail.trim() || null,
          phone: newClientPhone.trim() || null,
          address: newClientAddress.trim() || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Client added successfully');
        
        const clientRes = await fetch('/api/clients');
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setClients(clientData.clients || []);
        }
        
        setFormClientId(data.client.id);
        
        setNewClientName('');
        setNewClientCompany('');
        setNewClientEmail('');
        setNewClientPhone('');
        setNewClientAddress('');
        setShowAddClientForm(false);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save client', 'error');
      }
    } catch {
      showToast('Network error saving client', 'error');
    } finally {
      setIsSavingClient(false);
    }
  };

  // Submit Project Form
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formProjectName.trim()) {
      showToast('Client and Project Name are required', 'error');
      return;
    }

    const depts = [...formSelectedDepts];
    if (showCustomDeptInput && formCustomDept.trim()) {
      depts.push(formCustomDept.trim());
    }

    const payload = {
      clientId: Number(formClientId),
      projectName: formProjectName.trim(),
      description: formDescription,
      status: formStatus,
      priority: formPriority,
      startDate: formStartDate || null,
      endDate: formEndDate || null,
      projectManagerId: formPMId ? Number(formPMId) : null,
      assignedEmployees: formSelectedMembers,
      departments: depts
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Project created successfully');
        setIsCreateModalOpen(false);
        // Reset form
        setFormClientId('');
        setFormProjectName('');
        setFormDescription('');
        setFormPMId('');
        setFormSelectedMembers([]);
        setFormSelectedDepts([]);
        setFormCustomDept('');
        setShowCustomDeptInput(false);
        fetchProjects();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to create project', 'error');
      }
    } catch {
      showToast('Network error during project creation', 'error');
    }
  };

  // Edit Project Settings
  const openEditProjectModal = (proj: Project) => {
    setEditFormName(proj.projectName);
    setEditFormDesc(proj.description || '');
    setEditFormStatus(proj.status);
    setEditFormPriority(proj.priority);
    setEditFormStart(proj.startDate || '');
    setEditFormEnd(proj.endDate || '');
    setEditFormPMId(proj.projectManagerId || '');
    setEditFormClientId(proj.clientId);
    setIsEditProjectModalOpen(true);
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !editFormName.trim() || !editFormClientId) return;

    const payload = {
      projectName: editFormName.trim(),
      description: editFormDesc,
      status: editFormStatus,
      priority: editFormPriority,
      startDate: editFormStart || null,
      endDate: editFormEnd || null,
      projectManagerId: editFormPMId ? Number(editFormPMId) : null,
      clientId: Number(editFormClientId)
    };

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Project details updated successfully');
        setIsEditProjectModalOpen(false);
        fetchProjectDetails(selectedProjectId);
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Delete Project
  const handleDeleteProject = async (projId: number, projName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projName}"? This will delete all its deliverables, departments, notes, and files.`)) return;

    try {
      const res = await fetch(`/api/projects/${projId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Project deleted successfully');
        if (selectedProjectId === projId) {
          handleCloseDetail();
        } else {
          fetchProjects();
        }
      } else {
        showToast('Failed to delete project', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !memberFormEmpId) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: Number(memberFormEmpId),
          roleInProject: memberFormRole || 'Team Member'
        })
      });

      if (res.ok) {
        showToast('Team member added successfully');
        setIsAddMemberModalOpen(false);
        setMemberFormEmpId('');
        setMemberFormRole('');
        fetchProjectDetails(selectedProjectId);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to add member', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Remove Member
  const handleRemoveMember = async (empId: number) => {
    if (!selectedProjectId) return;
    if (!confirm('Remove this employee from the project team?')) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId })
      });

      if (res.ok) {
        showToast('Member removed from project');
        fetchProjectDetails(selectedProjectId);
      } else {
        showToast('Failed to remove member', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Add Department
  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !deptFormName.trim()) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentName: deptFormName.trim(),
          description: deptFormDesc
        })
      });

      if (res.ok) {
        showToast('Department added successfully');
        setIsAddDeptModalOpen(false);
        setDeptFormName('');
        setDeptFormDesc('');
        fetchProjectDetails(selectedProjectId);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to add department', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Delete Department
  const handleDeleteDept = async (deptId: number, name: string) => {
    if (!selectedProjectId) return;
    if (!confirm(`Delete department "${name}"? This will also delete all deliverables under it.`)) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/departments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: deptId })
      });

      if (res.ok) {
        showToast('Department deleted');
        fetchProjectDetails(selectedProjectId);
      } else {
        showToast('Failed to delete department', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Add Deliverable
  const handleAddDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !delivFormTitle.trim() || !delivFormDeptId) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: delivFormTitle.trim(),
          departmentId: Number(delivFormDeptId),
          targetQuantity: Number(delivFormTarget) || 1,
          completedQuantity: 0,
          status: 'Pending',
          dueDate: delivFormDue || null
        })
      });

      if (res.ok) {
        showToast('Deliverable created successfully');
        setIsAddDeliverableModalOpen(false);
        setDelivFormTitle('');
        setDelivFormDeptId('');
        setDelivFormTarget(1);
        setDelivFormDue('');
        fetchProjectDetails(selectedProjectId);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to create deliverable', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const openEditDeliverableModal = (deliv: ProjectDeliverable) => {
    setEditingDeliverable(deliv);
    setEditDelivTitle(deliv.title);
    setEditDelivDeptId(deliv.departmentId);
    setEditDelivTarget(deliv.targetQuantity);
    setEditDelivCompleted(deliv.completedQuantity);
    setEditDelivStatus(deliv.status);
    setEditDelivDue(deliv.dueDate ? deliv.dueDate.split('T')[0] : '');
    setIsEditDeliverableModalOpen(true);
  };

  const handleEditDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !editingDeliverable || !editDelivTitle.trim() || !editDelivDeptId) {
      showToast('Title and Department are required', 'error');
      return;
    }

    if (Number(editDelivTarget) < 1) {
      showToast('Target quantity must be at least 1', 'error');
      return;
    }
    if (Number(editDelivCompleted) < 0) {
      showToast('Completed quantity cannot be negative', 'error');
      return;
    }
    if (Number(editDelivCompleted) > Number(editDelivTarget)) {
      showToast('Completed quantity cannot exceed target quantity', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/deliverables/${editingDeliverable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editDelivTitle.trim(),
          departmentId: Number(editDelivDeptId),
          targetQuantity: Number(editDelivTarget),
          completedQuantity: Number(editDelivCompleted),
          status: editDelivStatus,
          dueDate: editDelivDue || null
        })
      });

      if (res.ok) {
        showToast('Deliverable updated successfully');
        setIsEditDeliverableModalOpen(false);
        fetchProjectDetails(selectedProjectId);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to update deliverable', 'error');
      }
    } catch {
      showToast('Network error updating deliverable', 'error');
    }
  };

  // Update Deliverable Quantities (Employees / Admins / Managers)
  const handleUpdateDeliverableProgress = async (deliv: ProjectDeliverable, completed: number) => {
    if (!selectedProjectId) return;
    const target = deliv.targetQuantity;
    const finalCompleted = Math.max(0, Math.min(completed, target));
    const status = finalCompleted === target ? 'Completed' : finalCompleted > 0 ? 'In Progress' : 'Pending';

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/deliverables/${deliv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedQuantity: finalCompleted,
          status
        })
      });

      if (res.ok) {
        showToast('Deliverable progress updated');
        fetchProjectDetails(selectedProjectId);
      } else {
        showToast('Failed to update deliverable progress', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Delete Deliverable
  const handleDeleteDeliverable = async (delivId: number) => {
    if (!selectedProjectId) return;
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/deliverables/${delivId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Deliverable deleted');
        fetchProjectDetails(selectedProjectId);
      } else {
        showToast('Failed to delete deliverable', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !noteContent.trim()) return;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent.trim() })
      });

      if (res.ok) {
        showToast('Note added successfully');
        setNoteContent('');
        fetchProjectDetails(selectedProjectId);
      } else {
        showToast('Failed to add note', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // File Attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProjectId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const simulatedUrl = `https://res.cloudinary.com/chutney-dashboard/image/upload/v12345/${Date.now()}_${encodeURIComponent(file.name)}`;

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: simulatedUrl
        })
      });

      if (res.ok) {
        showToast('File attached successfully');
        fetchProjectDetails(selectedProjectId);
      } else {
        showToast('Failed to attach file', 'error');
      }
    } catch {
      showToast('Network error during file upload', 'error');
    }
  };

  // Add Task directly inside the Project
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !taskFormTitle.trim() || !taskFormAssignTo) return;

    const payload = {
      title: taskFormTitle.trim(),
      description: taskFormDesc || null,
      assigned_to: Number(taskFormAssignTo),
      priority: taskFormPriority,
      due_date: taskFormDue || null,
      projectId: selectedProjectId,
      departmentId: taskFormDeptId ? Number(taskFormDeptId) : null
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Task added successfully');
        setIsAddTaskModalOpen(false);
        setTaskFormTitle('');
        setTaskFormDesc('');
        setTaskFormAssignTo('');
        setTaskFormDeptId('');
        setTaskFormPriority('Medium');
        setTaskFormDue('');
        fetchProjectDetails(selectedProjectId);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to create task', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Update Task Status from Project details view
  const handleUpdateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        showToast(`Task status updated to ${newStatus}`);
        if (selectedProjectId) {
          fetchProjectDetails(selectedProjectId);
        }
      } else {
        showToast('Failed to update task status', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  // Toggle department checkbox
  const handleDeptCheckbox = (deptName: string) => {
    if (formSelectedDepts.includes(deptName)) {
      setFormSelectedDepts(formSelectedDepts.filter(d => d !== deptName));
    } else {
      setFormSelectedDepts([...formSelectedDepts, deptName]);
    }
  };

  // Toggle employee checkbox
  const handleEmployeeCheckbox = (empId: number) => {
    if (formSelectedMembers.includes(empId)) {
      setFormSelectedMembers(formSelectedMembers.filter(id => id !== empId));
    } else {
      setFormSelectedMembers([...formSelectedMembers, empId]);
    }
  };

  // Stats calculation
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

  // Filter projects list
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    const matchesClient = clientFilter === 'all' || String(p.clientId) === clientFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesClient;
  });

  const getPriorityStyle = (p: string) => {
    if (p === 'Urgent' || p === 'High') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (p === 'Medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getStatusStyle = (s: string) => {
    if (s === 'Completed') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    if (s === 'Active') return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    if (s === 'On Hold') return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    return 'bg-slate-700/40 text-slate-400 border-slate-600/25';
  };

  if (selectedProjectId && projectDetail) {
    const p = projectDetail.project;
    return (
      <div className="flex-1 bg-[#060814] h-[calc(100vh-4rem)] p-8 text-slate-100 overflow-y-auto flex flex-col relative select-none">
        {/* Toast */}
        {toastMessage && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-2xl font-medium text-sm border flex items-center gap-2 ${
            toastType === 'success' ? 'bg-[#16a34a] border-[#22c55e]/30 text-white' : 'bg-rose-700 border-rose-500/30 text-white'
          }`}>
            {toastMessage}
          </div>
        )}

        {/* Back header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleCloseDetail}
            className="p-2 hover:bg-[#0f172a] rounded-lg transition-colors border border-[#1e293b]/50 cursor-pointer text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">{p.projectName}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${getStatusStyle(p.status)}`}>
                {p.status}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${getPriorityStyle(p.priority)}`}>
                {p.priority}
              </span>
            </div>
            <p className="text-[13px] text-slate-400 mt-1">
              Client: <span className="text-white font-medium">{p.clientName}</span> {p.companyName && `(${p.companyName})`}
            </p>
          </div>

          {isAdmin && (
            <div className="ml-auto flex gap-3">
              <button
                onClick={() => openEditProjectModal(p)}
                className="px-3.5 py-1.5 bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] text-slate-300 hover:text-white text-[12px] font-semibold rounded-md transition-colors cursor-pointer"
              >
                Edit Settings
              </button>
              <button
                onClick={() => handleDeleteProject(p.id, p.projectName)}
                className="px-3.5 py-1.5 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 text-[12px] font-semibold rounded-md transition-colors cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          )}
        </div>

        {/* Tabs navigation */}
        <div className="flex border-b border-[#15233c] mb-6">
          {(['overview', 'team', 'departments', 'deliverables'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[13.5px] font-medium border-b-2 transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? 'border-[#2563eb] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
          {/* Keep tasks tab code commented out for future use
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-5 py-3 text-[13.5px] font-medium border-b-2 transition-all cursor-pointer capitalize ${
              activeTab === 'tasks'
                ? 'border-[#2563eb] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            tasks
          </button>
          */}
        </div>

        {/* Tabs Content */}
        <div className="flex-1">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overview Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl">
                  <h3 className="text-[14px] font-bold text-white mb-4">Project Description</h3>
                  <p className="text-[13.5px] text-slate-300 leading-relaxed whitespace-pre-line">
                    {p.description || 'No description provided for this project.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-[#090f1e] border border-[#15233c] rounded-xl flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Start Date</span>
                    <span className="text-[15px] font-bold text-white mt-1 font-mono">{p.startDate || 'Not Set'}</span>
                  </div>
                  <div className="p-5 bg-[#090f1e] border border-[#15233c] rounded-xl flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">End Date</span>
                    <span className="text-[15px] font-bold text-white mt-1 font-mono">{p.endDate || 'Not Set'}</span>
                  </div>
                  <div className="p-5 bg-[#090f1e] border border-[#15233c] rounded-xl flex flex-col justify-center">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Project Manager</span>
                    <span className="text-[15px] font-bold text-white mt-1">{p.projectManagerName || 'Unassigned'}</span>
                  </div>
                  <div className="p-5 bg-[#090f1e] border border-[#15233c] rounded-xl flex flex-col justify-center font-mono">
                    <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Overall Progress</span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-2 bg-[#0d1628] rounded-full overflow-hidden border border-[#15233c]">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[14px] font-bold text-white">{p.progress}%</span>
                    </div>
                  </div>
                </div>

                {/* Notes system */}
                <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl">
                  <h3 className="text-[14px] font-bold text-white mb-4">Meeting Notes / Discussions</h3>
                  <form onSubmit={handleAddNote} className="mb-6 flex gap-3">
                    <input
                      type="text"
                      placeholder="Type a new comment or update note..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="flex-1 px-4 py-2 bg-[#050912] border border-[#1e293b] rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Post Note
                    </button>
                  </form>

                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-2">
                    {projectDetail.notes.length === 0 ? (
                      <p className="text-[12.5px] text-slate-500 italic">No notes posted yet.</p>
                    ) : (
                      projectDetail.notes.map((n) => (
                        <div key={n.id} className="p-3 bg-[#0d1527]/50 rounded-lg border border-[#141f35]/50 flex flex-col gap-1.5">
                          <p className="text-[13px] text-slate-200">{n.note}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold font-mono">
                            <span className="text-blue-400">{n.createdByName || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Files panel */}
              <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-bold text-white">Project Files</h3>
                  <label className="px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] text-slate-300 hover:text-white text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Attach
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-2">
                  {projectDetail.files.length === 0 ? (
                    <p className="text-[12.5px] text-slate-500 italic">No file attachments.</p>
                  ) : (
                    projectDetail.files.map((f) => (
                      <div key={f.id} className="p-3 bg-[#050912] border border-[#15233c] rounded-lg flex items-center justify-between">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-[12.5px] font-medium text-white truncate">{f.fileName}</p>
                          <p className="text-[9.5px] text-slate-500 font-mono mt-0.5">Uploaded by {f.uploadedByName || 'System'}</p>
                        </div>
                        <a
                          href={f.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-[#0f172a] rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Project Team</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">Assigned employees executing this project</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold rounded-md cursor-pointer flex items-center gap-1.5"
                  >
                    Add Member
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#15233c] text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Global Role</th>
                      <th className="py-3 px-4">Role in Project</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {projectDetail.members.map((m) => (
                      <tr key={m.id} className="border-b border-[#111c2e] hover:bg-[#0c1326]/50 text-[13px] text-slate-200">
                        <td className="py-3 px-4 font-semibold text-white">{m.name}</td>
                        <td className="py-3 px-4 font-mono text-[12px] text-slate-400">{m.email}</td>
                        <td className="py-3 px-4">{m.role}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-[10.5px] font-medium bg-[#1e293b] border border-[#334155] rounded text-slate-300">
                            {m.roleInProject}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleRemoveMember(m.employeeId)}
                              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-xs"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Project Divisions / Departments</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">Active organizational areas assigned to this project</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddDeptModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold rounded-md cursor-pointer"
                  >
                    Add Department
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectDetail.departments.map((d) => (
                  <div key={d.id} className="p-5 bg-[#050912] border border-[#15233c] rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-white">{d.departmentName}</h4>
                      <p className="text-[12.5px] text-slate-400 mt-1 leading-relaxed">
                        {d.description || 'No description specified for this department.'}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end gap-3 mt-4 border-t border-[#111c2e] pt-3.5">
                        <button
                          onClick={() => handleDeleteDept(d.id, d.departmentName)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                        >
                          Remove Department
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Project Deliverables</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">Target campaigns and measurable quantities</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddDeliverableModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold rounded-md cursor-pointer"
                  >
                    Add Deliverable
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {projectDetail.deliverables.map((deliv) => {
                  const percent = Math.round((deliv.completedQuantity / deliv.targetQuantity) * 100);
                  return (
                    <div key={deliv.id} className="p-5 bg-[#050912] border border-[#15233c] rounded-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="text-[14px] font-bold text-white">{deliv.title}</h4>
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-[#1e293b] text-slate-300 rounded border border-[#334155]">
                              {deliv.departmentName}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                              deliv.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              deliv.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-700/30 text-slate-400 border-slate-600/20'
                            }`}>
                              {deliv.status}
                            </span>
                          </div>
                          {deliv.dueDate && (
                            <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold uppercase">
                              Due: {deliv.dueDate.split('T')[0]}
                            </p>
                          )}
                        </div>

                        {/* Interactive sliders for progress */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[12.5px] font-semibold text-slate-300">
                            Completed: <strong className="text-white">{deliv.completedQuantity}</strong> / {deliv.targetQuantity}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUpdateDeliverableProgress(deliv, deliv.completedQuantity - 1)}
                              disabled={deliv.completedQuantity <= 0}
                              className="w-7 h-7 bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleUpdateDeliverableProgress(deliv, deliv.completedQuantity + 1)}
                              disabled={deliv.completedQuantity >= deliv.targetQuantity}
                              className="w-7 h-7 bg-[#0f172a] border border-[#1e293b] hover:bg-[#1e293b] rounded flex items-center justify-center text-slate-300 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-3 ml-2">
                              <button
                                onClick={() => openEditDeliverableModal(deliv)}
                                className="text-blue-400 hover:text-blue-300 text-xs font-semibold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteDeliverable(deliv.id)}
                                className="text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#0d1628] rounded-full overflow-hidden border border-[#15233c]">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 font-mono">{percent}%</span>
                      </div>
                    </div>
                  );
                })}

                {projectDetail.deliverables.length === 0 && (
                  <p className="text-[12.5px] text-slate-500 italic text-center py-6">No deliverables set up for this project.</p>
                )}
              </div>
            </div>
          )}

          {/* Keep tasks content pane commented out for future use
          activeTab === 'tasks' && (
            <div className="p-6 bg-[#090f1e] border border-[#15233c] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Project Tasks</h3>
                  <p className="text-[12px] text-slate-400 mt-0.5">Tasks connected directly to this project's execution</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setTaskFormTitle('');
                      setTaskFormDesc('');
                      setTaskFormAssignTo(projectDetail.members[0]?.employeeId || '');
                      setTaskFormDeptId(projectDetail.departments[0]?.id || '');
                      setTaskFormPriority('Medium');
                      setTaskFormDue('');
                      setIsAddTaskModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold rounded-md cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Task
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {projectTasks.map((t) => (
                  <div key={t.id} className="p-4 bg-[#050912] border border-[#15233c] rounded-xl flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[13.5px] font-bold text-white truncate">{t.title}</h4>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${getPriorityStyle(t.priority)}`}>
                          {t.priority}
                        </span>
                        {t.status === 'Completed' && (
                          <span className="text-emerald-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-400 mt-1 line-clamp-1">{t.description || 'No description.'}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500 font-mono font-semibold uppercase">
                        <span>Assignee: <strong className="text-slate-300">{t.assigned_to_name || 'System'}</strong></span>
                        {t.due_date && <span>Due: <strong className="text-slate-300">{t.due_date}</strong></span>}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {(t.assigned_to === currentUser.id || isAdmin || isManager) ? (
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value as Task['status'])}
                          className="bg-[#0f172a] border border-[#1e293b] text-slate-200 text-xs font-semibold rounded px-2.5 py-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${
                          t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          t.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-700/30 text-slate-400 border-slate-600/20'
                        }`}>
                          {t.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {projectTasks.length === 0 && (
                  <p className="text-[12.5px] text-slate-500 italic text-center py-6">No tasks assigned to this project.</p>
                )}
              </div>
            </div>
          )*/}
        </div>

        {/* Modals inside Detail view */}
        {/* Edit Project modal */}
        {isEditProjectModalOpen && (
          <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative">
              <h2 className="text-[17px] font-bold text-white mb-4">Edit Project Settings</h2>
              <form onSubmit={handleEditProject} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editFormName}
                    onChange={(e) => setEditFormName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Description</label>
                  <textarea
                    value={editFormDesc}
                    onChange={(e) => setEditFormDesc(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Status</label>
                    <select
                      value={editFormStatus}
                      onChange={(e) => setEditFormStatus(e.target.value as Project['status'])}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Priority</label>
                    <select
                      value={editFormPriority}
                      onChange={(e) => setEditFormPriority(e.target.value as Project['priority'])}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Start Date</label>
                    <input
                      type="date"
                      value={editFormStart}
                      onChange={(e) => setEditFormStart(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">End Date</label>
                    <input
                      type="date"
                      value={editFormEnd}
                      onChange={(e) => setEditFormEnd(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Project Manager</label>
                  <select
                    value={editFormPMId}
                    onChange={(e) => setEditFormPMId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="">Select Manager</option>
                    {employees.filter(e => e.role === 'Admin' || e.role === 'Manager').map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Client</label>
                  <select
                    value={editFormClientId}
                    onChange={(e) => setEditFormClientId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : (c.company_name ? `(${c.company_name})` : '')}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditProjectModalOpen(false)}
                    className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member modal */}
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative">
              <h2 className="text-[17px] font-bold text-white mb-4">Add Team Member</h2>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Select Employee</label>
                  <select
                    required
                    value={memberFormEmpId}
                    onChange={(e) => {
                      const empId = e.target.value ? Number(e.target.value) : '';
                      setMemberFormEmpId(empId);
                      if (empId) {
                        const selectedEmp = employees.find(emp => emp.id === empId);
                        if (selectedEmp) {
                          setMemberFormRole(selectedEmp.work || selectedEmp.role);
                        }
                      } else {
                        setMemberFormRole('');
                      }
                    }}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="">Choose employee...</option>
                    {employees.filter(e => !projectDetail.members.some(m => m.employeeId === e.id)).map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.work || e.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Role in Project</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Auto-populated from employee specialization"
                    value={memberFormRole}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e]/50 border border-[#1e293b] rounded-lg text-slate-400 text-sm focus:outline-none cursor-not-allowed font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Dept modal */}
        {isAddDeptModalOpen && (
          <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative">
              <h2 className="text-[17px] font-bold text-white mb-4">Add Project Department</h2>
              <form onSubmit={handleAddDept} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website, Accounts, Social Media"
                    value={deptFormName}
                    onChange={(e) => setDeptFormName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Description</label>
                  <textarea
                    placeholder="Describe tasks managed under this division"
                    value={deptFormDesc}
                    onChange={(e) => setDeptFormDesc(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none h-20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDeptModalOpen(false)}
                    className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Deliverable modal */}
        {isAddDeliverableModalOpen && (
          <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative">
              <h2 className="text-[17px] font-bold text-white mb-4">Add Project Deliverable</h2>
              <form onSubmit={handleAddDeliverable} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Instagram Reels, Homepage Mockups"
                    value={delivFormTitle}
                    onChange={(e) => setDelivFormTitle(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Department Link</label>
                  <select
                    required
                    value={delivFormDeptId}
                    onChange={(e) => setDelivFormDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="">Choose department...</option>
                    {projectDetail.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Target Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={delivFormTarget}
                    onChange={(e) => setDelivFormTarget(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div className="font-mono">
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Due Date</label>
                  <input
                    type="date"
                    value={delivFormDue}
                    onChange={(e) => setDelivFormDue(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDeliverableModalOpen(false)}
                    className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Deliverable modal */}
        {isEditDeliverableModalOpen && editingDeliverable && (
          <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative">
              <h2 className="text-[17px] font-bold text-white mb-4">Edit Project Deliverable</h2>
              <form onSubmit={handleEditDeliverable} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Instagram Reels, Homepage Mockups"
                    value={editDelivTitle}
                    onChange={(e) => setEditDelivTitle(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Department Link</label>
                  <select
                    required
                    value={editDelivDeptId}
                    onChange={(e) => setEditDelivDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="">Choose department...</option>
                    {projectDetail.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Target Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editDelivTarget}
                      onChange={(e) => setEditDelivTarget(Number(e.target.value))}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Completed Qty</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={editDelivCompleted}
                      onChange={(e) => setEditDelivCompleted(Number(e.target.value))}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Status</label>
                    <select
                      value={editDelivStatus}
                      onChange={(e) => setEditDelivStatus(e.target.value as ProjectDeliverable['status'])}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="font-mono">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Due Date</label>
                    <input
                      type="date"
                      value={editDelivDue}
                      onChange={(e) => setEditDelivDue(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditDeliverableModalOpen(false)}
                    className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {isAddTaskModalOpen && (
          <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative">
              <h2 className="text-[17px] font-bold text-white mb-4">Add Task</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Write Homepage copy"
                    value={taskFormTitle}
                    onChange={(e) => setTaskFormTitle(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Description</label>
                  <textarea
                    placeholder="Explain task deliverables..."
                    value={taskFormDesc}
                    onChange={(e) => setTaskFormDesc(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none h-16"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Assignee</label>
                  <select
                    required
                    value={taskFormAssignTo}
                    onChange={(e) => setTaskFormAssignTo(e.target.value ? Number(e.target.value) : '')}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="">Choose employee...</option>
                    {projectDetail.members.map(m => (
                      <option key={m.employeeId} value={m.employeeId}>{m.name} ({m.roleInProject})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Department Division</label>
                  <select
                    value={taskFormDeptId}
                    onChange={(e) => setTaskFormDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="">General Project / Unassigned</option>
                    {projectDetail.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Priority</label>
                    <select
                      value={taskFormPriority}
                      onChange={(e) => setTaskFormPriority(e.target.value as any)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="font-mono">
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Due Date</label>
                    <input
                      type="date"
                      value={taskFormDue}
                      onChange={(e) => setTaskFormDue(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTaskModalOpen(false)}
                    className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#060814] h-[calc(100vh-4rem)] p-8 text-slate-100 overflow-y-auto flex flex-col relative select-none">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-2xl font-medium text-sm border flex items-center gap-2 ${
          toastType === 'success' ? 'bg-[#16a34a] border-[#22c55e]/30 text-white' : 'bg-rose-700 border-rose-500/30 text-white'
        }`}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[25px] font-bold text-white tracking-[0.2px]">Projects Management</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            {isAdmin ? 'Define deliverables, departments, track completion percentages and team workloads' : 'View projects you are assigned to'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormClientId('');
              setFormProjectName('');
              setFormDescription('');
              setFormPMId(employees.filter(e => e.role === 'Admin' || e.role === 'Manager')[0]?.id || '');
              setFormSelectedMembers([]);
              setFormSelectedDepts([]);
              setFormCustomDept('');
              setShowCustomDeptInput(false);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold rounded-md transition-colors flex items-center gap-2 shadow-[0_2px_4px_rgba(37,99,235,0.15)] border border-[#3b82f6]/10 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Project
          </button>
        )}
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#1e293b] rounded-xl flex justify-between items-center shadow-lg">
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{totalProjects}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Projects</span>
          </div>
          <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
            📁
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#1e3a8a]/40 to-[#0f172a] border border-[#1d4ed8]/20 rounded-xl flex justify-between items-center shadow-lg">
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{activeProjects}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mt-1">Active Projects</span>
          </div>
          <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
            ⚡
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#064e3b]/40 to-[#0f172a] border border-[#059669]/20 rounded-xl flex justify-between items-center shadow-lg">
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{completedProjects}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-1">Completed Projects</span>
          </div>
          <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
            ✅
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-[#78350f]/40 to-[#0f172a] border border-[#d97706]/20 rounded-xl flex justify-between items-center shadow-lg">
          <div className="flex flex-col">
            <span className="text-[32px] font-bold text-white leading-tight font-mono">{onHoldProjects}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-1">On Hold Projects</span>
          </div>
          <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
            ⏱
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-5 bg-[#090f1e] border border-[#15233c] rounded-xl flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search project name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-[#050912] border border-[#1e293b] rounded-lg text-slate-100 text-xs focus:outline-none focus:border-blue-500/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#050912] border border-[#1e293b] text-slate-300 text-xs rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-[#050912] border border-[#1e293b] text-slate-300 text-xs rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 bg-[#050912] border border-[#1e293b] text-slate-300 text-xs rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="all">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <svg className="w-10 h-10 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-[#090f1e] border border-[#15233c] rounded-xl flex flex-col items-center justify-center">
          <span className="text-3xl mb-3">📁</span>
          <p className="text-slate-400 text-sm font-semibold">No projects found matching the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => handleProjectClick(p.id)}
              className="bg-[#090f1e] border border-[#15233c] hover:border-blue-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:shadow-[0_4px_20px_rgba(37,99,235,0.06)] group"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase font-mono ${getStatusStyle(p.status)}`}>
                    {p.status}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase font-mono ${getPriorityStyle(p.priority)}`}>
                    {p.priority}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-white group-hover:text-blue-400 transition-colors leading-tight truncate">
                  {p.projectName}
                </h3>
                <p className="text-[12.5px] text-slate-400 font-semibold mt-1">
                  {p.clientName}
                </p>
                <p className="text-[12px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-4 my-5 border-y border-[#15233c] py-4 text-[12px]">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Start Date</span>
                    <span className="text-slate-300 font-medium font-mono mt-0.5">{p.startDate || 'Not Set'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">End Date</span>
                    <span className="text-slate-300 font-medium font-mono mt-0.5">{p.endDate || 'Not Set'}</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-[11px] mb-1.5 font-mono">
                    <span className="text-slate-400">Project Completion</span>
                    <span className="text-white font-bold">{p.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0d1628] rounded-full overflow-hidden border border-[#15233c]">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 border-t border-[#111c2e] pt-3 text-[11px] text-slate-400 font-semibold font-mono uppercase">
                  <span>Divisions: <strong className="text-white">{p.departmentsCount}</strong></span>
                  <span>Tasks: <strong className="text-white">{p.tasksCount}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-[#02040a]/80 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 flex justify-center items-start">
          <div className="w-full max-w-3xl bg-[#050912] border border-[#15233c] rounded-2xl shadow-2xl p-6 relative my-8">
            <h2 className="text-[17px] font-bold text-white mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Select Client */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Select Client</label>
                      <button
                        type="button"
                        onClick={() => setShowAddClientForm(!showAddClientForm)}
                        className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        {showAddClientForm ? '✕ Close Form' : '+ Add New Client'}
                      </button>
                    </div>
                    {!showAddClientForm ? (
                      <select
                        required
                        value={formClientId}
                        onChange={(e) => setFormClientId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                      >
                        <option value="">Choose Client...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : (c.company_name ? `(${c.company_name})` : '')}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-2 p-3 bg-[#0d1527] border border-[#1b2a47] rounded-lg space-y-2">
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Add Client Inline</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Client Name *"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#050912] border border-[#1e293b] rounded text-white text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={newClientCompany}
                            onChange={(e) => setNewClientCompany(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#050912] border border-[#1e293b] rounded text-white text-xs focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#050912] border border-[#1e293b] rounded text-white text-xs focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-[#050912] border border-[#1e293b] rounded text-white text-xs focus:outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Address"
                          value={newClientAddress}
                          onChange={(e) => setNewClientAddress(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#050912] border border-[#1e293b] rounded text-white text-xs focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddClientForm(false);
                              setNewClientName('');
                              setNewClientCompany('');
                              setNewClientEmail('');
                              setNewClientPhone('');
                              setNewClientAddress('');
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSavingClient}
                            onClick={handleAddClientInline}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            {isSavingClient ? 'Saving...' : 'Save Client'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Project Name */}
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Project Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Reset Interiors Marketing"
                      value={formProjectName}
                      onChange={(e) => setFormProjectName(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Description</label>
                    <textarea
                      placeholder="Summarize campaigns, website details or deliverables..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none h-[104px] resize-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Priority</label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as any)}
                        className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Project Manager</label>
                    <select
                      value={formPMId}
                      onChange={(e) => setFormPMId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full mt-1.5 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    >
                      <option value="">Select PM...</option>
                      {employees.filter(e => e.role === 'Admin' || e.role === 'Manager').map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Checklist Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-[#15233c]/60">
                {/* Departments checklist */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Project Departments / divisions</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 h-32 overflow-y-auto p-2 bg-[#090f1e] border border-[#1e293b] rounded-lg">
                    {DEFAULTS_DEPARTMENTS.map((dept) => (
                      <label key={dept} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formSelectedDepts.includes(dept)}
                          onChange={() => handleDeptCheckbox(dept)}
                          className="rounded bg-[#050912] border-[#1e293b] text-blue-500 focus:ring-0"
                        />
                        {dept}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCustomDeptInput}
                        onChange={(e) => setShowCustomDeptInput(e.target.checked)}
                        className="rounded bg-[#050912] border-[#1e293b] text-blue-500 focus:ring-0"
                      />
                      Other
                    </label>
                  </div>
                  {showCustomDeptInput && (
                    <input
                      type="text"
                      placeholder="Enter custom department name..."
                      value={formCustomDept}
                      onChange={(e) => setFormCustomDept(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-[#090f1e] border border-[#1e293b] rounded-lg text-white text-sm focus:outline-none"
                    />
                  )}
                </div>

                {/* Employees assignment checklist */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Assign Team Members</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 h-32 overflow-y-auto p-2 bg-[#090f1e] border border-[#1e293b] rounded-lg">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formSelectedMembers.includes(emp.id)}
                          onChange={() => handleEmployeeCheckbox(emp.id)}
                          className="rounded bg-[#050912] border-[#1e293b] text-blue-500 focus:ring-0"
                        />
                        {emp.name} ({emp.work || emp.role})
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#15233c]/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#1e293b] hover:bg-[#0f172a] text-slate-300 text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
