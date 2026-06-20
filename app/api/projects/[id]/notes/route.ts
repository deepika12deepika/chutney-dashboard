import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = Number(id);

    const dbUser = await sql`SELECT role FROM users WHERE id = ${session.userId} LIMIT 1`;
    const userRole = dbUser[0]?.role || session.role;

    // Access control: Non-admin/manager must be a project member to add notes
    if (userRole !== 'Admin' && userRole !== 'Manager') {
      const membership = await sql`
        SELECT id FROM project_members 
        WHERE project_id = ${projectId} AND employee_id = ${session.userId}
        LIMIT 1
      `;
      if (membership.length === 0) {
        return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
      }
    }

    const { note } = await request.json();

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO project_notes (project_id, note, created_by)
      VALUES (${projectId}, ${note.trim()}, ${session.userId})
      RETURNING *
    `;

    return NextResponse.json({ success: true, note: result[0] });
  } catch (error) {
    console.error('[Project Notes POST Error]', error);
    return NextResponse.json({ error: 'Failed to add project note' }, { status: 500 });
  }
}
