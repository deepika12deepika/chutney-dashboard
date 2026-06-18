import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// POST /api/auth/logout
export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Logout Error]', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
