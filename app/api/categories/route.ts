import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/categories — returns all password categories
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await sql`
      SELECT id, name, description, created_at
      FROM credential_categories
      ORDER BY name ASC
    `;

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[Categories GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories — Admin only: create new category
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO credential_categories (name, description)
      VALUES (${name.trim()}, ${description || null})
      RETURNING id, name, description, created_at
    `;

    return NextResponse.json({ success: true, category: result[0] });
  } catch (error) {
    console.error('[Categories POST Error]', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
