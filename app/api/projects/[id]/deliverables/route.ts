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

    const dbUser = await sql`SELECT role FROM users WHERE id = ${session.userId} LIMIT 1`;
    const userRole = dbUser[0]?.role || session.role;

    if (userRole !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const projectId = Number(id);
    const { departmentId, title, targetQuantity, completedQuantity, status, dueDate } = await request.json();

    if (!departmentId || !title || !title.trim()) {
      return NextResponse.json({ error: 'Department and Title are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO project_deliverables (
        project_id, department_id, title, target_quantity, completed_quantity, status, due_date
      )
      VALUES (
        ${projectId},
        ${Number(departmentId)},
        ${title.trim()},
        ${Number(targetQuantity) || 1},
        ${Number(completedQuantity) || 0},
        ${status || 'Pending'},
        ${dueDate ? new Date(dueDate) : null}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, deliverable: result[0] });
  } catch (error) {
    console.error('[Project Deliverables POST Error]', error);
    return NextResponse.json({ error: 'Failed to create deliverable' }, { status: 500 });
  }
}
