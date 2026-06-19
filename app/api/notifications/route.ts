import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// GET /api/notifications
// Returns notifications for the logged-in user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await sql`
      SELECT 
        id, 
        user_id AS "userId", 
        title, 
        message, 
        type, 
        is_read AS "is_read", 
        created_at AS "created_at"
      FROM notifications
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('[Notifications GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications
// Marks a notification as read
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const result = await sql`
      UPDATE notifications
      SET is_read = true
      WHERE id = ${Number(id)} AND user_id = ${session.userId}
      RETURNING id, user_id AS "userId", title, message, type, is_read AS "is_read", created_at AS "created_at"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: result[0] });
  } catch (error) {
    console.error('[Notifications PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
