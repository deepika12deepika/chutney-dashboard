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
}

export interface UserProfile {
  name: string;
  role: string;
  password?: string;
}
