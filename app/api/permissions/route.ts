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

    if (!session.isLoggedIn || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const permissions = await sql`
      SELECT 
        up.id,
        up.user_id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        up.category_id AS "categoryId",
        pc.name AS "categoryName",
        up.created_at AS "createdAt"
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      JOIN password_categories pc ON up.category_id = pc.id
      ORDER BY u.name, pc.name
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

    if (!session.isLoggedIn || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, categoryId } = await request.json();

    if (!userId || !categoryId) {
      return NextResponse.json({ error: 'userId and categoryId are required' }, { status: 400 });
    }

    // Upsert to prevent duplicate permissions
    const result = await sql`
      INSERT INTO user_permissions (user_id, category_id)
      VALUES (${userId}, ${categoryId})
      ON CONFLICT (user_id, category_id) DO NOTHING
      RETURNING id, user_id AS "userId", category_id AS "categoryId", created_at AS "createdAt"
    `;

    return NextResponse.json({ success: true, permission: result[0] || null }, { status: 201 });
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

    if (!session.isLoggedIn || session.role !== 'Admin') {
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
