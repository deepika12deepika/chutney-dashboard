const { neon } = require("c:/Users/bscit/Documents/GitHub/chutney-dashboard/node_modules/@neondatabase/serverless");
const dbUrl = "postgresql://neondb_owner:npg_0Fu2HIsoenKC@ep-old-rain-at4nwfqb-pooler.c-9.us-east-1.aws.neon.tech/beyond-branding?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function check() {
  try {
    const tables = [
      'project_members',
      'project_departments',
      'project_deliverables',
      'project_files',
      'project_notes',
      'tasks'
    ];
    for (const t of tables) {
      const cols = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${t}
      `;
      console.log(`Table: ${t}`);
      cols.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
}

check();
