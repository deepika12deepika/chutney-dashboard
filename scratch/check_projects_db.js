const { neon } = require("c:/Users/bscit/Documents/GitHub/chutney-dashboard/node_modules/@neondatabase/serverless");
const dbUrl = "postgresql://neondb_owner:npg_0Fu2HIsoenKC@ep-old-rain-at4nwfqb-pooler.c-9.us-east-1.aws.neon.tech/beyond-branding?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function check() {
  try {
    const projects = await sql`SELECT * FROM projects`;
    console.log('Projects count:', projects.length);
    console.log('Projects:', projects);

    const depts = await sql`SELECT * FROM project_departments`;
    console.log('Departments:', depts);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

check();
