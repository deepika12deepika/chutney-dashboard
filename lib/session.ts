import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: number;
  name: string;
  email: string;
  role: 'Admin' | 'Employee' | 'Manager';
  work?: string | null;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'bb_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
  ttl: 60 * 60 * 24 * 7, // 7 days
};
