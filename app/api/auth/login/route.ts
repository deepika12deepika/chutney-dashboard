import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const users = await sql`
      SELECT id, name, email, password, role, work
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify bcrypt password hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    session.userId = user.id;
    session.name = user.name;
    session.email = user.email;
    session.role = user.role;
    session.work = user.work || null;
    session.isLoggedIn = true;

    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        work: user.work || null,
      },
    });
  } catch (error: unknown) {
    console.error('[Login Error]', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
