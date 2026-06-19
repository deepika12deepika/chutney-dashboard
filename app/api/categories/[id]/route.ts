import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import sql from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/categories/[id] — Admin only: update category
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
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Check duplicate name
    const existing = await sql`
      SELECT id FROM credential_categories 
      WHERE LOWER(name) = ${name.toLowerCase().trim()} AND id != ${Number(id)} 
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }

    const result = await sql`
      UPDATE credential_categories
      SET name = ${name.trim()}, description = ${description || null}
      WHERE id = ${Number(id)}
      RETURNING id, name, description, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category: result[0] });
  } catch (error) {
    console.error('[Category PATCH Error]', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/categories/[id] — Admin only: remove category
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
    const categoryId = Number(id);

    // Check if category is used by any credentials
    const credentialsUsing = await sql`
      SELECT id FROM credentials WHERE category_id = ${categoryId} LIMIT 1
    `;

    if (credentialsUsing.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category: it is referenced by existing credentials.' },
        { status: 400 }
      );
    }

    // Remove associated user permissions first
    await sql`DELETE FROM user_permissions WHERE category_id = ${categoryId}`;
    
    // Delete category
    const result = await sql`
      DELETE FROM credential_categories WHERE id = ${categoryId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Category DELETE Error]', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
