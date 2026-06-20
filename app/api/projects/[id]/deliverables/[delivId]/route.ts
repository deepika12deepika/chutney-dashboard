import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string; delivId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, delivId } = await params;
    const projectId = Number(id);
    const deliverableId = Number(delivId);

    const dbUser = await sql`SELECT role FROM users WHERE id = ${session.userId} LIMIT 1`;
    const userRole = dbUser[0]?.role || session.role;

    // Access control
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

    // Get current deliverable
    const existing = await sql`
      SELECT * FROM project_deliverables WHERE id = ${deliverableId} AND project_id = ${projectId} LIMIT 1
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }
    const current = existing[0];

    const body = await request.json();
    const { title, departmentId, targetQuantity, completedQuantity, status, dueDate } = body;

    let finalTitle = current.title;
    let finalDeptId = current.department_id;
    let finalTarget = current.target_quantity;
    let finalCompleted = current.completed_quantity;
    let finalStatus = current.status;
    let finalDueDate = current.due_date;

    if (userRole === 'Admin') {
      if (title !== undefined) finalTitle = title;
      if (departmentId !== undefined) finalDeptId = Number(departmentId);
      if (targetQuantity !== undefined) finalTarget = Number(targetQuantity);
      if (completedQuantity !== undefined) finalCompleted = Number(completedQuantity);
      if (status !== undefined) finalStatus = status;
      if (dueDate !== undefined) finalDueDate = dueDate ? new Date(dueDate) : null;
    } else {
      // Employees and Managers can update completedQuantity and status
      if (completedQuantity !== undefined) finalCompleted = Number(completedQuantity);
      if (status !== undefined) finalStatus = status;
    }

    const result = await sql`
      UPDATE project_deliverables
      SET
        title = ${finalTitle},
        department_id = ${finalDeptId},
        target_quantity = ${finalTarget},
        completed_quantity = ${finalCompleted},
        status = ${finalStatus},
        due_date = ${finalDueDate}
      WHERE id = ${deliverableId} AND project_id = ${projectId}
      RETURNING *
    `;

    // Notify if status transitioned to Completed
    if (finalStatus === 'Completed' && current.status !== 'Completed') {
      const projRes = await sql`
        SELECT project_name, project_manager_id FROM projects WHERE id = ${projectId} LIMIT 1
      `;
      const project = projRes[0];
      const delivTitle = finalTitle || current.title;

      if (project) {
        if (project.project_manager_id) {
          await sql`
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES (
              ${project.project_manager_id},
              'Deliverable Completed',
              ${`Deliverable "${delivTitle}" in Project "${project.project_name}" has been completed.`},
              'system',
              false
            )
          `;
        }

        const admins = await sql`SELECT id FROM users WHERE role = 'Admin'`;
        for (const a of admins) {
          if (a.id !== session.userId && a.id !== project.project_manager_id) {
            await sql`
              INSERT INTO notifications (user_id, title, message, type, is_read)
              VALUES (
                ${a.id},
                'Deliverable Completed',
                ${`Deliverable "${delivTitle}" in Project "${project.project_name}" has been completed.`},
                'system',
                false
              )
            `;
          }
        }
      }
    }

    return NextResponse.json({ success: true, deliverable: result[0] });
  } catch (error) {
    console.error('[Project Deliverables PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update deliverable' }, { status: 500 });
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

    const { id, delivId } = await params;
    const projectId = Number(id);
    const deliverableId = Number(delivId);

    await sql`
      DELETE FROM project_deliverables 
      WHERE id = ${deliverableId} AND project_id = ${projectId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Project Deliverables DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete deliverable' }, { status: 500 });
  }
}
