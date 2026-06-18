import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/auth/verify-password
// Used by the "Show Password" security modal to confirm the user's identity
// before revealing a stored credential password. Returns 200 or 401.
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Fetch the current user's stored hash
    const users = await sql`
      SELECT password FROM users WHERE id = ${session.userId} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, users[0].password);

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Verify Password Error]', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
