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
    const { departmentName, description } = await request.json();

    if (!departmentName || !departmentName.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO project_departments (project_id, department_name, description)
      VALUES (${projectId}, ${departmentName.trim()}, ${description || null})
      RETURNING *
    `;

    // Notify members of the project about the new department
    const members = await sql`SELECT employee_id FROM project_members WHERE project_id = ${projectId}`;
    const projName = await sql`SELECT project_name FROM projects WHERE id = ${projectId} LIMIT 1`;
    const pName = projName[0]?.project_name || 'Project';

    for (const m of members) {
      if (m.employee_id !== session.userId) {
        await sql`
          INSERT INTO notifications (user_id, title, message, type, is_read)
          VALUES (
            ${m.employee_id},
            'Department Added',
            ${`Department "${departmentName.trim()}" has been added to Project: ${pName}.`},
            'system',
            false
          )
        `;
      }
    }

    return NextResponse.json({ success: true, department: result[0] });
  } catch (error) {
    console.error('[Project Departments POST Error]', error);
    return NextResponse.json({ error: 'Failed to add department' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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
    const { departmentId } = await request.json();

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM project_departments 
      WHERE id = ${Number(departmentId)} AND project_id = ${projectId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Project Departments DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
    const { departmentId, departmentName, description } = await request.json();

    if (!departmentId || !departmentName || !departmentName.trim()) {
      return NextResponse.json({ error: 'Department ID and name are required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE project_departments
      SET department_name = ${departmentName.trim()}, description = ${description || null}
      WHERE id = ${Number(departmentId)} AND project_id = ${projectId}
      RETURNING *
    `;

    return NextResponse.json({ success: true, department: result[0] });
  } catch (error) {
    console.error('[Project Departments PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}
