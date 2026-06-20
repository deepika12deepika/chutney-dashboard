import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/tasks
// Admin: returns all tasks
// Employee/Manager: returns only tasks assigned to them
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

    let tasks;

    if (userRole === 'Admin') {
      tasks = await sql`
        SELECT 
          t.id, t.title, t.description, t.assigned_to, t.assigned_by, t.status, t.priority,
          TO_CHAR(t.start_date, 'YYYY-MM-DD') AS "start_date",
          TO_CHAR(t.due_date, 'YYYY-MM-DD') AS "due_date",
          t.created_at AS "created_at",
          t.completed_at AS "completed_at",
          u_to.name AS "assigned_to_name",
          u_by.name AS "assigned_by_name",
          t.project_id AS "projectId",
          t.department_id AS "departmentId",
          p.project_name AS "projectName",
          pd.department_name AS "departmentName"
        FROM tasks t
        LEFT JOIN users u_to ON t.assigned_to = u_to.id
        LEFT JOIN users u_by ON t.assigned_by = u_by.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_departments pd ON t.department_id = pd.id
        ORDER BY t.created_at DESC
      `;
    } else {
      tasks = await sql`
        SELECT 
          t.id, t.title, t.description, t.assigned_to, t.assigned_by, t.status, t.priority,
          TO_CHAR(t.start_date, 'YYYY-MM-DD') AS "start_date",
          TO_CHAR(t.due_date, 'YYYY-MM-DD') AS "due_date",
          t.created_at AS "created_at",
          t.completed_at AS "completed_at",
          u_to.name AS "assigned_to_name",
          u_by.name AS "assigned_by_name",
          t.project_id AS "projectId",
          t.department_id AS "departmentId",
          p.project_name AS "projectName",
          pd.department_name AS "departmentName"
        FROM tasks t
        LEFT JOIN users u_to ON t.assigned_to = u_to.id
        LEFT JOIN users u_by ON t.assigned_by = u_by.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN project_departments pd ON t.department_id = pd.id
        WHERE t.assigned_to = ${session.userId}
        ORDER BY t.created_at DESC
      `;
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[Tasks GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks — Admin only
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

    const { title, description, assigned_to, priority, due_date, projectId, departmentId } = await request.json();

    if (!title || !assigned_to || !priority) {
      return NextResponse.json(
        { error: 'Title, assigned employee, and priority are required' },
        { status: 400 }
      );
    }

    // Insert task into DB
    const result = await sql`
      INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date, status, project_id, department_id)
      VALUES (
        ${title},
        ${description || null},
        ${Number(assigned_to)},
        ${session.userId},
        ${priority},
        ${due_date ? new Date(due_date) : null},
        'Pending',
        ${projectId ? Number(projectId) : null},
        ${departmentId ? Number(departmentId) : null}
      )
      RETURNING id, title, description, assigned_to, assigned_by, status, priority, created_at, completed_at, project_id AS "projectId", department_id AS "departmentId"
    `;

    const task = result[0];

    // Create a task assignment notification for the assigned employee
    await sql`
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (
        ${Number(assigned_to)},
        'New Task Assigned',
        ${`You have been assigned ${title}.`},
        'task_assigned',
        false
      )
    `;

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error('[Tasks POST Error]', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
