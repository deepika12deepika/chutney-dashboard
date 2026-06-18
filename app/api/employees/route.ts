import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/employees — Admin only: list all employees
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query DB for user's actual role to prevent stale session 403s
    const dbUser = await sql`
      SELECT role FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    const userRole = dbUser[0]?.role || session.role;

    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const employees = await sql`
      SELECT id, name, email, role, created_at, work
      FROM users
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('[Employees GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST /api/employees — Admin only: create new employee
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query DB for user's actual role to prevent stale session 403s
    const dbUser = await sql`
      SELECT role FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    const userRole = dbUser[0]?.role || session.role;

    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, email, password, role, work } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password and role are required' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await sql`
      INSERT INTO users (name, email, password, role, work)
      VALUES (${name.trim()}, ${email.toLowerCase().trim()}, ${hashedPassword}, ${role}, ${work || null})
      RETURNING id, name, email, role, created_at, work
    `;

    return NextResponse.json({ success: true, employee: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[Employees POST Error]', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
