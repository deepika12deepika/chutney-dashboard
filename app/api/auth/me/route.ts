import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// GET /api/auth/me
// Returns the current session user. Called by the dashboard on mount to hydrate the client state.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        work: session.work || null,
      },
    });
  } catch (error) {
    console.error('[Me Error]', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}
