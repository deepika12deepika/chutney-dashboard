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
        pc.name AS "categoryName"
      FROM user_permissions up
      JOIN users u ON up.user_id = u.id
      JOIN credential_categories pc ON up.category_id = pc.id
      ORDER BY u.name, pc.name
    `;

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('[Permissions GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

// POST /api/permissions — Admin only: grant or sync folder permissions
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

    const body = await request.json();
    const { userId, categoryId, categoryIds } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check if it is a batch sync request
    if (Array.isArray(categoryIds)) {
      // 1. Delete all existing permissions for this user
      await sql`
        DELETE FROM user_permissions WHERE user_id = ${userId}
      `;

      // 2. Insert new selections
      if (categoryIds.length > 0) {
        for (const catId of categoryIds) {
          await sql`
            INSERT INTO user_permissions (user_id, category_id)
            VALUES (${userId}, ${catId})
          `;
        }
      }

      // Generate a credential assigned notification if permissions changed
      await sql`
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES (
          ${userId},
          'Credential Permissions Updated',
          'Admin updated your credential folder permissions.',
          'credential_assigned',
          false
        )
      `;

      return NextResponse.json({ success: true });
    }

    // Single permission toggle fallback
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId or categoryIds is required' }, { status: 400 });
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

// DELETE /api/permissions — Admin only: revoke permission (fallback)
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
