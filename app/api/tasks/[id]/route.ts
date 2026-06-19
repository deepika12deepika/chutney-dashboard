import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/tasks/[id]
// Admin: edit any task fields
// Employee/Manager: update task status only for own tasks
export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = await params;
    const taskId = Number(id);

    // Fetch existing task
    const existingTasks = await sql`
      SELECT * FROM tasks WHERE id = ${taskId} LIMIT 1
    `;

    if (existingTasks.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = existingTasks[0];

    const body = await request.json();

    if (userRole === 'Admin') {
      // Admin can update all fields
      const title = body.title !== undefined ? body.title : task.title;
      const description = body.description !== undefined ? body.description : task.description;
      const assigned_to = body.assigned_to !== undefined ? Number(body.assigned_to) : task.assigned_to;
      const priority = body.priority !== undefined ? body.priority : task.priority;
      const status = body.status !== undefined ? body.status : task.status;
      const due_date = body.due_date !== undefined ? (body.due_date ? new Date(body.due_date) : null) : task.due_date;

      let completed_at = task.completed_at;
      if (status === 'Completed' && task.status !== 'Completed') {
        completed_at = new Date();
      } else if (status !== 'Completed') {
        completed_at = null;
      }

      const result = await sql`
        UPDATE tasks
        SET
          title = ${title},
          description = ${description},
          assigned_to = ${assigned_to},
          priority = ${priority},
          status = ${status},
          due_date = ${due_date},
          completed_at = ${completed_at}
        WHERE id = ${taskId}
        RETURNING *
      `;

      return NextResponse.json({ success: true, task: result[0] });
    } else {
      // Employee/Manager can only update status of their own task
      if (task.assigned_to !== session.userId) {
        return NextResponse.json({ error: 'Forbidden: Task is not assigned to you' }, { status: 403 });
      }

      const { status } = body;

      if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid task status' }, { status: 400 });
      }

      let completed_at = task.completed_at;
      if (status === 'Completed' && task.status !== 'Completed') {
        completed_at = new Date();
      } else if (status !== 'Completed') {
        completed_at = null;
      }

      const result = await sql`
        UPDATE tasks
        SET 
          status = ${status},
          completed_at = ${completed_at}
        WHERE id = ${taskId}
        RETURNING *
      `;

      const updatedTask = result[0];

      // If task is completed, generate a notification for the Admin who assigned it
      if (status === 'Completed' && task.status !== 'Completed') {
        const adminId = task.assigned_by;
        if (adminId) {
          await sql`
            INSERT INTO notifications (user_id, title, message, type, is_read)
            VALUES (
              ${adminId},
              'Task Completed',
              ${`${session.name} completed ${task.title} task.`},
              'task_completed',
              false
            )
          `;
        }
      }

      return NextResponse.json({ success: true, task: updatedTask });
    }
  } catch (error) {
    console.error('[Task PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — Admin only
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
    await sql`DELETE FROM tasks WHERE id = ${Number(id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Task DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
