import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/permissions — Admin only: all permission assignments
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    // if (!session.isLoggedIn || session.role !== 'Admin') {
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

    const permissions = await sql`
      SELECT 
        up.id,
        up.user_id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        up.category_id AS "categoryId",
        pc.category_name AS "categoryName"
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      JOIN password_categories pc ON up.category_id = pc.id
      ORDER BY u.name, pc.category_name
    `;

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('[Permissions GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST /api/permissions — Admin only: grant a category to an employee
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

    const { userId, categoryId } = await request.json();

    if (!userId || !categoryId) {
      return NextResponse.json({ error: 'userId and categoryId are required' }, { status: 400 });
    }

    // Manual check to prevent duplicates since there is no unique constraint
    const existing = await sql`
      SELECT id, user_id AS "userId", category_id AS "categoryId"
      FROM user_permissions
      WHERE user_id = ${userId} AND category_id = ${categoryId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ success: true, permission: existing[0] }, { status: 201 });
    }

    const result = await sql`
      INSERT INTO user_permissions (user_id, category_id)
      VALUES (${userId}, ${categoryId})
      RETURNING id, user_id AS "userId", category_id AS "categoryId"
    `;

    return NextResponse.json({ success: true, permission: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[Permissions POST Error]', error);
    return NextResponse.json({ error: 'Failed to grant permission' }, { status: 500 });
  }
}

// DELETE /api/permissions — Admin only: revoke permission
export async function DELETE(request: Request) {
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

    const { userId, categoryId } = await request.json();

    await sql`
      DELETE FROM user_permissions
      WHERE user_id = ${userId} AND category_id = ${categoryId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Permissions DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to revoke permission' }, { status: 500 });
  }
}
