import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clients = await sql`
      SELECT 
        id, 
        client_name AS "clientName", 
        client_email AS "clientEmail",
        client_phone AS "clientPhone",
        category,
        priority,
        start_date AS "startDate", 
        end_date AS "endDate", 
        reason, 
        created_at AS "createdAt"
      FROM clients
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { clientName, clientEmail, clientPhone, category, priority, startDate, endDate, reason } = await request.json();

    if (!clientName || !clientEmail || !clientPhone || !category || !priority || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO clients (client_name, client_email, client_phone, category, priority, start_date, end_date, reason)
      VALUES (${clientName}, ${clientEmail}, ${clientPhone}, ${category}, ${priority}, ${startDate}, ${endDate}, ${reason})
      RETURNING *
    `;

    return NextResponse.json({ success: true, client: result[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}