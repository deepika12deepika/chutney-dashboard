import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await sql`
      SELECT 
        id, 
        client_name AS "clientName", 
        start_date AS "startDate", 
        end_date AS "endDate", 
        reason, 
        created_at AS "createdAt"
      FROM clients
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[Clients GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientName, startDate, endDate, reason } = await request.json();

    if (!clientName || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO clients (client_name, start_date, end_date, reason)
      VALUES (${clientName.trim()}, ${startDate}, ${endDate}, ${reason.trim()})
      RETURNING 
        id, 
        client_name AS "clientName", 
        start_date AS "startDate", 
        end_date AS "endDate", 
        reason, 
        created_at AS "createdAt"
    `;

    return NextResponse.json({ success: true, client: result[0] });
  } catch (error) {
    console.error('[Clients POST Error]', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/clients — all authenticated users
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await sql`
      SELECT id, name, company_name AS "companyName", email, phone, address, created_at AS "createdAt"
      FROM project_clients
      ORDER BY name ASC
    `;

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[Clients GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/clients — Admin only
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

    const { name, companyName, email, phone, address } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO project_clients (name, company_name, email, phone, address)
      VALUES (${name.trim()}, ${companyName || null}, ${email || null}, ${phone || null}, ${address || null})
      RETURNING id, name, company_name AS "companyName", email, phone, address, created_at AS "createdAt"
    `;

    return NextResponse.json({ success: true, client: result[0] }, { status: 201 });
  } catch (error) {
    console.error('[Clients POST Error]', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
