import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST /api/auth/setup
// One-time route to seed the default admin user into the database
// Call this once then optionally remove or disable this file
export async function POST() {
  try {
    // Check if admin already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = 'admin@beyondbranding.com' LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'Admin already exists. Setup not required.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);

    const result = await sql`
      INSERT INTO users (name, email, password, role)
      VALUES ('Sandhya', 'admin@beyondbranding.com', ${hashedPassword}, 'Admin')
      RETURNING id, name, email, role, created_at
    `;

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully.',
      user: result[0],
    });
  } catch (error: unknown) {
    console.error('[Setup Error]', error);
    const message = error instanceof Error ? error.message : 'Setup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
