const { neon } = require("c:/Users/bscit/Documents/GitHub/chutney-dashboard/node_modules/@neondatabase/serverless");
const dbUrl = "postgresql://neondb_owner:npg_0Fu2HIsoenKC@ep-old-rain-at4nwfqb-pooler.c-9.us-east-1.aws.neon.tech/beyond-branding?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function check() {
  try {
    const projects = await sql`SELECT id FROM projects LIMIT 5`;
    console.log('Projects:', projects);
    if (projects.length === 0) {
      console.log('No projects in database.');
      return;
    }
    const projectId = projects[0].id;
    console.log('Testing with project ID:', projectId);

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
    console.log('Overview fetched successfully:', overviewRes);

    const [members, departments, deliverables, files, notes] = await Promise.all([
      sql`
        SELECT pm.id, pm.employee_id AS "employeeId", u.name, u.email, u.role, pm.role_in_project AS "roleInProject"
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

    console.log('All details query succeeded');
    console.log('Members count:', members.length);
    console.log('Departments count:', departments.length);
    console.log('Deliverables count:', deliverables.length);
  } catch (err) {
    console.error('ERROR during detail queries:', err);
  }
}

check();
