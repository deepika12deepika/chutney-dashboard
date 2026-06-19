import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/notifications/[id]
// Deletes a specific notification for the logged-in user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = Number(id);

    const result = await sql`
      DELETE FROM notifications
      WHERE id = ${notificationId} AND user_id = ${session.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notification DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
