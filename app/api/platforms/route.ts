import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/platforms — returns all platforms
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platforms = await sql`
      SELECT id, name, created_at
      FROM credential_platforms
      ORDER BY name ASC
    `;

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('[Platforms GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 });
  }
}

// POST /api/platforms — Admin only: create new platform
export async function POST(request: Request) {
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

    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Platform name is required' }, { status: 400 });
    }

    // Check duplicate
    const existing = await sql`
      SELECT id FROM credential_platforms
      WHERE LOWER(name) = ${name.toLowerCase().trim()}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Platform already exists' }, { status: 409 });
    }

    const result = await sql`
      INSERT INTO credential_platforms (name)
      VALUES (${name.trim()})
      RETURNING id, name, created_at
    `;

    return NextResponse.json({ success: true, platform: result[0] });
  } catch (error) {
    console.error('[Platforms POST Error]', error);
    return NextResponse.json({ error: 'Failed to create platform' }, { status: 500 });
  }
}
