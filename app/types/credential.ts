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
  createdAt: string;
}

// ─── Legacy alias (kept for backward compatibility with older components) ───
export interface UserProfile {
  name: string;
  role: string;
  password?: string;
}
