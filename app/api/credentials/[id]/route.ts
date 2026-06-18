import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/credentials/[id] — Admin only
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
    const { title, platform, clientName, username, password, status, notes, categoryId } =
      await request.json();

    const result = await sql`
      UPDATE credentials
      SET
        title = ${title},
        platform = ${platform || null},
        client_name = ${clientName || null},
        username = ${username},
        password_value = ${password},
        status = ${status},
        notes = ${notes || null},
        category_id = ${categoryId || null}
      WHERE id = ${Number(id)}
      RETURNING
        id, title, platform,
        client_name AS "clientName",
        username, password_value AS "password", status, notes,
        created_at AS "createdAt",
        category_id AS "categoryId"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, credential: result[0] });
  } catch (error) {
    console.error('[Credential PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update credential' }, { status: 500 });
  }
}

// DELETE /api/credentials/[id] — Admin only
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
    await sql`DELETE FROM credentials WHERE id = ${Number(id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Credential DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
