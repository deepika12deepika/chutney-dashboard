import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/projects/[id]/members — Admin only: add team member
export async function POST(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const projectId = Number(id);

    const { employeeId, roleInProject } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee is required' }, { status: 400 });
    }

    // Check if employee exists
    const empUser = await sql`SELECT name FROM users WHERE id = ${Number(employeeId)} LIMIT 1`;
    if (empUser.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Insert membership
    await sql`
      INSERT INTO project_members (project_id, employee_id, role_in_project)
      VALUES (${projectId}, ${Number(employeeId)}, ${roleInProject || 'Team Member'})
      ON CONFLICT (project_id, employee_id) DO UPDATE 
      SET role_in_project = ${roleInProject || 'Team Member'}
    `;

    // Notify employee
    const projName = await sql`SELECT project_name FROM projects WHERE id = ${projectId} LIMIT 1`;
    const pName = projName[0]?.project_name || 'Project';

    await sql`
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (
        ${Number(employeeId)},
        'New Project Assigned',
        ${`You have been assigned to Project: ${pName}.`},
        'system',
        false
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Project Members POST Error]', error);
    return NextResponse.json({ error: 'Failed to add project member' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members — Admin only: remove team member
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const projectId = Number(id);

    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM project_members 
      WHERE project_id = ${projectId} AND employee_id = ${Number(employeeId)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Project Members DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to remove project member' }, { status: 500 });
  }
}
