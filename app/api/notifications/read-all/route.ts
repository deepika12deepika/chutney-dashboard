import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

// POST /api/notifications/read-all
// Marks all notifications as read for the logged-in user
export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await sql`
      UPDATE notifications
      SET is_read = true
      WHERE user_id = ${session.userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications read-all Error]', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
