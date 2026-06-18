import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/credentials
// Admin: all credentials
// Employee: only credentials in categories they have permission to view
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query DB for user's actual role to prevent stale session issues
    const dbUser = await sql`
      SELECT role FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    const userRole = dbUser[0]?.role || session.role;

    let credentials;

      //   if (userRole === 'Admin' || userRole === 'Manager') {
      // // Admin / Manager: see everything

    if (userRole === 'Admin') {
      // Only Admin sees everything automatically
      credentials = await sql`
        SELECT 
          c.id,
          c.title,
          c.platform,
          c.client_name AS "clientName",
          c.username,
          c.password_value AS "password",
          c.status,
          c.notes,
          c.created_at AS "createdAt",
          pc.category_name AS "categoryName",
          pc.id AS "categoryId"
        FROM credentials c
        LEFT JOIN password_categories pc ON c.category_id = pc.id
        ORDER BY c.created_at DESC
      `;
    } else {
      // Employee: only permitted categories
      credentials = await sql`
        SELECT 
          c.id,
          c.title,
          c.platform,
          c.client_name AS "clientName",
          c.username,
          c.password_value AS "password",
          c.status,
          c.notes,
          c.created_at AS "createdAt",
          pc.category_name AS "categoryName",
          pc.id AS "categoryId"
        FROM credentials c
        INNER JOIN password_categories pc ON c.category_id = pc.id
        INNER JOIN user_permissions up ON up.category_id = c.category_id
        WHERE up.user_id = ${session.userId}
        ORDER BY c.created_at DESC
      `;
    }

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error('[Credentials GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST /api/credentials — Admin only
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

    const { title, platform, clientName, username, password, status, notes, categoryId } =
      await request.json();

    if (!title || !username || !password) {
      return NextResponse.json(
        { error: 'Title, username and password are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO credentials (title, platform, client_name, username, password_value, status, notes, category_id)
      VALUES (
        ${title},
        ${platform || null},
        ${clientName || null},
        ${username},
        ${password},
        ${status || 'active'},
        ${notes || null},
        ${categoryId || null}
      )
      RETURNING 
        id, title, platform, 
        client_name AS "clientName",
        username, password_value AS "password", status, notes,
        created_at AS "createdAt",
        category_id AS "categoryId"
    `;

    return NextResponse.json({ success: true, credential: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[Credentials POST Error]', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}
