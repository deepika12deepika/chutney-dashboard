import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] — detail view
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = Number(id);

    // Query DB for user's actual role to prevent stale session issues
    const dbUser = await sql`
      SELECT role FROM users WHERE id = ${session.userId} LIMIT 1
    `;
    const userRole = dbUser[0]?.role || session.role;

    // RBAC: Non-admin/manager must be a project member to view details
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

    // Fetch details
    const overviewRes = await sql`
      SELECT 
        p.id, p.client_id AS "clientId", p.project_name AS "projectName", p.description, p.status, p.priority,
        TO_CHAR(p.start_date, 'YYYY-MM-DD') AS "startDate",
        TO_CHAR(p.end_date, 'YYYY-MM-DD') AS "endDate",
        p.project_manager_id AS "projectManagerId",
        u_pm.name AS "projectManagerName",
        c.name AS "clientName",
        c.company_name AS "companyName"
      FROM projects p
      LEFT JOIN project_clients c ON p.client_id = c.id
      LEFT JOIN users u_pm ON p.project_manager_id = u_pm.id
      WHERE p.id = ${projectId}
      LIMIT 1
    `;

    if (overviewRes.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const [members, departments, deliverables, files, notes] = await Promise.all([
      sql`
        SELECT pm.id, pm.employee_id AS "employeeId", u.name, u.email, u.role, COALESCE(u.work, pm.role_in_project, u.role) AS "roleInProject"
        FROM project_members pm
        JOIN users u ON pm.employee_id = u.id
        WHERE pm.project_id = ${projectId}
      `,
      sql`
        SELECT id, department_name AS "departmentName", description
        FROM project_departments
        WHERE project_id = ${projectId}
      `,
      sql`
        SELECT d.id, d.title, d.target_quantity AS "targetQuantity", d.completed_quantity AS "completedQuantity", d.status, d.due_date AS "dueDate", d.department_id AS "departmentId", pd.department_name AS "departmentName"
        FROM project_deliverables d
        JOIN project_departments pd ON d.department_id = pd.id
        WHERE d.project_id = ${projectId}
      `,
      sql`
        SELECT f.id, f.file_name AS "fileName", f.file_url AS "fileUrl", f.uploaded_by AS "uploadedBy", u.name AS "uploadedByName", f.uploaded_at AS "uploadedAt"
        FROM project_files f
        LEFT JOIN users u ON f.uploaded_by = u.id
        WHERE f.project_id = ${projectId}
      `,
      sql`
        SELECT n.id, n.note, n.created_by AS "createdBy", u.name AS "createdByName", n.created_at AS "createdAt"
        FROM project_notes n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.project_id = ${projectId}
        ORDER BY n.created_at DESC
      `
    ]);

    return NextResponse.json({
      project: overviewRes[0],
      members,
      departments,
      deliverables,
      files,
      notes
    });
  } catch (error) {
    console.error('[Project GET Detail Error]', error);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
}

// PATCH /api/projects/[id] — Admin only: update core details
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const projectId = Number(id);

    const body = await request.json();
    const { projectName, description, status, priority, startDate, endDate, projectManagerId, clientId } = body;

    // Check existing project
    const existing = await sql`SELECT * FROM projects WHERE id = ${projectId} LIMIT 1`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const currentProject = existing[0];

    const finalProjectName = projectName !== undefined ? projectName : currentProject.project_name;
    const finalDescription = description !== undefined ? description : currentProject.description;
    const finalStatus = status !== undefined ? status : currentProject.status;
    const finalPriority = priority !== undefined ? priority : currentProject.priority;
    const finalStartDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : currentProject.start_date;
    const finalEndDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : currentProject.end_date;
    const finalPMId = projectManagerId !== undefined ? (projectManagerId ? Number(projectManagerId) : null) : currentProject.project_manager_id;
    const finalClientId = clientId !== undefined ? (clientId ? Number(clientId) : null) : currentProject.client_id;

    const result = await sql`
      UPDATE projects
      SET 
        project_name = ${finalProjectName},
        description = ${finalDescription},
        status = ${finalStatus},
        priority = ${finalPriority},
        start_date = ${finalStartDate},
        end_date = ${finalEndDate},
        project_manager_id = ${finalPMId},
        client_id = ${finalClientId},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
      RETURNING *
    `;

    // Trigger Notification for employees if status changed to 'Completed'
    if (finalStatus === 'Completed' && currentProject.status !== 'Completed') {
      const team = await sql`SELECT employee_id FROM project_members WHERE project_id = ${projectId}`;
      for (const t of team) {
        await sql`
          INSERT INTO notifications (user_id, title, message, type, is_read)
          VALUES (
            ${t.employee_id},
            'Project Completed',
            ${`Project "${finalProjectName}" has been marked as Completed.`},
            'system',
            false
          )
        `;
      }
    }

    return NextResponse.json({ success: true, project: result[0] });
  } catch (error) {
    console.error('[Project PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] — Admin only: delete project
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const projectId = Number(id);

    // CASCADE handles project_members, project_departments, project_deliverables, project_files, project_notes
    const result = await sql`
      DELETE FROM projects WHERE id = ${projectId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Project DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
