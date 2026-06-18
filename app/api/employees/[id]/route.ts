import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/employees/[id] — Admin only: update employee
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const { name, email, role, password, work } = await request.json();

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email.toLowerCase().trim()}, role = ${role}, password = ${hashedPassword}, work = ${work || null}
        WHERE id = ${Number(id)}
      `;
    } else {
      await sql`
        UPDATE users 
        SET name = ${name}, email = ${email.toLowerCase().trim()}, role = ${role}, work = ${work || null}
        WHERE id = ${Number(id)}
      `;
    }

    const result = await sql`
      SELECT id, name, email, role, created_at, work FROM users WHERE id = ${Number(id)} LIMIT 1
    `;

    return NextResponse.json({ success: true, employee: result[0] });
  } catch (error) {
    console.error('[Employee PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

// DELETE /api/employees/[id] — Admin only: remove employee (cannot delete self)
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = await params;

    if (Number(id) === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Remove associated permissions first
    await sql`DELETE FROM user_permissions WHERE user_id = ${Number(id)}`;
    await sql`DELETE FROM users WHERE id = ${Number(id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Employee DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
