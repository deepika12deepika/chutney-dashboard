// ─── Credential stored in DB ───────────────────────────────────────────────
export interface Credential {
  id: string;
  title: string;
  platform: string;
  clientName: string;
  username: string;
  password?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  notes?: string;
  categoryId?: number | null;
  categoryName?: string | null;
}

// ─── Session user (from iron-session / /api/auth/me) ───────────────────────
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Employee' | 'Manager';
  work?: string | null;
}

// ─── Employee (from /api/employees) ────────────────────────────────────────
export interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Employee' | 'Manager';
  created_at: string;
  work?: string | null;
}

// ─── Password Category (from /api/categories) ──────────────────────────────
export interface Category {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
}

// ─── Permission assignment (from /api/permissions) ─────────────────────────
export interface Permission {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  categoryId: number;
  categoryName: string;
  // createdAt: string;
  createdAt?: string;
}

// ─── Legacy alias (kept for backward compatibility with older components) ───
export interface UserProfile {
  name: string;
  role: string;
  password?: string;
}

// ─── Task (from /api/tasks) ──────────────────────────────────────────────────
export interface Task {
  id: number;
  title: string;
  description?: string | null;
  assigned_to: number;
  assigned_to_name?: string;
  assigned_by: number;
  assigned_by_name?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date?: string | null;
  created_at: string;
  completed_at?: string | null;
}

// ─── Notification (from /api/notifications) ──────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  title?: string | null;
  message: string;
  type: 'task_completed' | 'task_assigned' | 'credential_assigned' | 'system';
  is_read: boolean;
  created_at: string;
}
