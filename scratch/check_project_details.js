const { neon } = require("c:/Users/bscit/Documents/GitHub/chutney-dashboard/node_modules/@neondatabase/serverless");
const dbUrl = "postgresql://neondb_owner:npg_0Fu2HIsoenKC@ep-old-rain-at4nwfqb-pooler.c-9.us-east-1.aws.neon.tech/beyond-branding?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function check() {
  try {
    console.log('Querying table names...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables:', tables.map(t => t.table_name));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

check();
