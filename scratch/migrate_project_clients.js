const { neon } = require("c:/Users/bscit/Documents/GitHub/chutney-dashboard/node_modules/@neondatabase/serverless");
const dbUrl = "postgresql://neondb_owner:npg_0Fu2HIsoenKC@ep-old-rain-at4nwfqb-pooler.c-9.us-east-1.aws.neon.tech/beyond-branding?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function run() {
  console.log('Starting project_clients migration...');
  try {
    // 1. Drop foreign key constraint on projects pointing to clients
    console.log('Dropping foreign key from projects...');
    await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey`;

    // 2. Create project_clients table
    console.log('Creating project_clients table...');
    await sql`
      CREATE TABLE IF NOT EXISTS project_clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Seed project_clients if empty
    console.log('Checking project_clients data...');
    const count = await sql`SELECT id FROM project_clients LIMIT 1`;
    if (count.length === 0) {
      console.log('Seeding default project_clients...');
      await sql`
        INSERT INTO project_clients (name, company_name, email, phone, address)
        VALUES 
          ('Reset Interiors', 'Reset Interiors', 'info@resetinteriors.com', '+123456789', 'New York'),
          ('Apex Solutions', 'Apex Solutions Ltd', 'contact@apex.com', '+987654321', 'London')
      `;
    }

    // 4. Truncate existing project tables to rebuild them cleanly with references to project_clients
    console.log('Cleaning old project tables to avoid reference issues...');
    await sql`TRUNCATE TABLE project_notes CASCADE`;
    await sql`TRUNCATE TABLE project_files CASCADE`;
    await sql`TRUNCATE TABLE project_deliverables CASCADE`;
    await sql`TRUNCATE TABLE project_departments CASCADE`;
    await sql`TRUNCATE TABLE project_members CASCADE`;
    await sql`TRUNCATE TABLE projects CASCADE`;

    // 5. Add new foreign key constraint pointing to project_clients
    console.log('Adding new foreign key constraint to project_clients...');
    await sql`
      ALTER TABLE projects 
      ADD CONSTRAINT projects_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES project_clients(id) ON DELETE CASCADE
    `;

    // 6. Re-seed default projects
    console.log('Re-seeding initial project data...');
    const clientsMap = {};
    const clientsRes = await sql`SELECT id, name FROM project_clients`;
    clientsRes.forEach(c => { clientsMap[c.name] = c.id; });

    const adminUser = await sql`SELECT id FROM users WHERE email = 'admin@beyondbranding.com' LIMIT 1`;
    const managerUser = await sql`SELECT id FROM users WHERE role = 'Manager' LIMIT 1`;
    const employeeUser = await sql`SELECT id FROM users WHERE role = 'Employee' LIMIT 1`;

    const createdBy = adminUser[0]?.id || 1;
    const pmId = managerUser[0]?.id || adminUser[0]?.id || 1;
    const empId = employeeUser[0]?.id || pmId;

    if (clientsMap['Reset Interiors']) {
      const projRes = await sql`
        INSERT INTO projects (client_id, project_name, description, status, priority, start_date, end_date, project_manager_id, created_by)
        VALUES (
          ${clientsMap['Reset Interiors']},
          'Reset Interiors Marketing',
          'Full scale digital marketing, website development, content writing and social media campaigns.',
          'Active',
          'High',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '30 days',
          ${pmId},
          ${createdBy}
        )
        RETURNING id
      `;
      const projId = projRes[0]?.id;
      if (projId) {
        // Seed departments
        const depts = await sql`
          INSERT INTO project_departments (project_id, department_name, description)
          VALUES 
            (${projId}, 'Social Media', 'Instagram, Facebook, and LinkedIn campaign management'),
            (${projId}, 'Website', 'Next.js website design and deployment'),
            (${projId}, 'Accounts', 'Monthly invoicing and accounts management')
          RETURNING id, department_name
        `;

        // Seed members
        await sql`
          INSERT INTO project_members (project_id, employee_id, role_in_project)
          VALUES 
            (${projId}, ${createdBy}, 'Project Owner'),
            (${projId}, ${pmId}, 'Project Manager'),
            (${projId}, ${empId}, 'Execution Specialist')
        `;

        // Seed deliverables
        const socialDept = depts.find(d => d.department_name === 'Social Media');
        if (socialDept) {
          await sql`
            INSERT INTO project_deliverables (project_id, department_id, title, target_quantity, completed_quantity, status, due_date)
            VALUES (
              ${projId},
              ${socialDept.id},
              'Instagram Reels',
              8,
              3,
              'In Progress',
              CURRENT_DATE + INTERVAL '15 days'
            )
          `;
        }
      }
    }

    console.log('Project clients migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
