import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/projects
export async function GET() {
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

    let projects;

    if (userRole === 'Admin' || userRole === 'Manager') {
      // Admins and Managers see all projects
      projects = await sql`
        SELECT 
          p.id,
          p.project_name AS "projectName",
          p.description,
          p.status,
          p.priority,
          TO_CHAR(p.start_date, 'YYYY-MM-DD') AS "startDate",
          TO_CHAR(p.end_date, 'YYYY-MM-DD') AS "endDate",
          p.project_manager_id AS "projectManagerId",
          u_pm.name AS "projectManagerName",
          p.client_id AS "clientId",
          c.name AS "clientName",
          c.company_name AS "companyName",
          COUNT(DISTINCT pd.id) AS "departmentsCount",
          COUNT(DISTINCT t.id) AS "tasksCount",
          COUNT(DISTINCT CASE WHEN d.status != 'Completed' THEN d.id END) AS "pendingDeliverablesCount",
          COALESCE(ROUND((COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END)::NUMERIC / NULLIF(COUNT(DISTINCT t.id), 0)) * 100), 0) AS progress
        FROM projects p
        LEFT JOIN project_clients c ON p.client_id = c.id
        LEFT JOIN users u_pm ON p.project_manager_id = u_pm.id
        LEFT JOIN project_departments pd ON pd.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN project_deliverables d ON d.project_id = p.id
        GROUP BY p.id, c.id, u_pm.id
        ORDER BY p.created_at DESC
      `;
    } else {
      // Employees see only assigned projects
      projects = await sql`
        SELECT 
          p.id,
          p.project_name AS "projectName",
          p.description,
          p.status,
          p.priority,
          TO_CHAR(p.start_date, 'YYYY-MM-DD') AS "startDate",
          TO_CHAR(p.end_date, 'YYYY-MM-DD') AS "endDate",
          p.project_manager_id AS "projectManagerId",
          u_pm.name AS "projectManagerName",
          p.client_id AS "clientId",
          c.name AS "clientName",
          c.company_name AS "companyName",
          COUNT(DISTINCT pd.id) AS "departmentsCount",
          COUNT(DISTINCT t.id) AS "tasksCount",
          COUNT(DISTINCT CASE WHEN d.status != 'Completed' THEN d.id END) AS "pendingDeliverablesCount",
          COALESCE(ROUND((COUNT(DISTINCT CASE WHEN t.status = 'Completed' THEN t.id END)::NUMERIC / NULLIF(COUNT(DISTINCT t.id), 0)) * 100), 0) AS progress
        FROM projects p
        LEFT JOIN project_clients c ON p.client_id = c.id
        LEFT JOIN users u_pm ON p.project_manager_id = u_pm.id
        LEFT JOIN project_departments pd ON pd.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN project_deliverables d ON d.project_id = p.id
        WHERE p.id IN (
          SELECT project_id FROM project_members WHERE employee_id = ${session.userId}
        )
        GROUP BY p.id, c.id, u_pm.id
        ORDER BY p.created_at DESC
      `;
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('[Projects GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects — Admin only
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

    const body = await request.json();
    const {
      clientId,
      projectName,
      description,
      status,
      priority,
      startDate,
      endDate,
      projectManagerId,
      assignedEmployees, // Array of employee IDs (numbers)
      departments // Array of strings (department names)
    } = body;

    if (!clientId || !projectName || !projectName.trim()) {
      return NextResponse.json(
        { error: 'Client and Project Name are required' },
        { status: 400 }
      );
    }

    // Check duplicate project name for this client
    const existingProject = await sql`
      SELECT id FROM projects 
      WHERE client_id = ${Number(clientId)} AND LOWER(project_name) = ${projectName.trim().toLowerCase()}
      LIMIT 1
    `;
    if (existingProject.length > 0) {
      return NextResponse.json(
        { error: 'A project with this name already exists for the selected client.' },
        { status: 400 }
      );
    }

    // 1. Insert Project
    const projResult = await sql`
      INSERT INTO projects (
        client_id, project_name, description, status, priority, 
        start_date, end_date, project_manager_id, created_by
      )
      VALUES (
        ${Number(clientId)},
        ${projectName.trim()},
        ${description || null},
        ${status || 'Active'},
        ${priority || 'Medium'},
        ${startDate ? new Date(startDate) : null},
        ${endDate ? new Date(endDate) : null},
        ${projectManagerId ? Number(projectManagerId) : null},
        ${session.userId}
      )
      RETURNING id, project_name AS "projectName"
    `;

    const project = projResult[0];
    const projectId = project.id;

    // 2. Insert Departments
    if (Array.isArray(departments) && departments.length > 0) {
      for (const deptName of departments) {
        if (deptName && deptName.trim()) {
          await sql`
            INSERT INTO project_departments (project_id, department_name)
            VALUES (${projectId}, ${deptName.trim()})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }

    // 3. Insert Members (Manager automatically + assigned Employees)
    const membersToInsert = new Set<number>();
    if (projectManagerId) {
      membersToInsert.add(Number(projectManagerId));
    }
    if (Array.isArray(assignedEmployees)) {
      assignedEmployees.forEach(empId => {
        if (empId) membersToInsert.add(Number(empId));
      });
    }

    for (const empId of membersToInsert) {
      const isPM = empId === Number(projectManagerId);
      const roleInProject = isPM ? 'Project Manager' : 'Team Member';
      await sql`
        INSERT INTO project_members (project_id, employee_id, role_in_project)
        VALUES (${projectId}, ${empId}, ${roleInProject})
        ON CONFLICT DO NOTHING
      `;

      // 4. Trigger assignment notification for employees (except if the admin assigns themselves)
      if (empId !== session.userId) {
        await sql`
          INSERT INTO notifications (user_id, title, message, type, is_read)
          VALUES (
            ${empId},
            'New Project Assigned',
            ${`You have been assigned to Project: ${projectName.trim()}.`},
            'system',
            false
          )
        `;
      }
    }

    // Notify all admins about new project creation
    const admins = await sql`SELECT id FROM users WHERE role = 'Admin'`;
    for (const admin of admins) {
      if (admin.id !== session.userId) {
        await sql`
          INSERT INTO notifications (user_id, title, message, type, is_read)
          VALUES (
            ${admin.id},
            'New Project Created',
            ${`Project "${projectName.trim()}" has been created.`},
            'system',
            false
          )
        `;
      }
    }

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('[Projects POST Error]', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
