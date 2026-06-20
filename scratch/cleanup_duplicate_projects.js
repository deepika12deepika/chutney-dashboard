const { neon } = require("c:/Users/bscit/Documents/GitHub/chutney-dashboard/node_modules/@neondatabase/serverless");
const dbUrl = "postgresql://neondb_owner:npg_0Fu2HIsoenKC@ep-old-rain-at4nwfqb-pooler.c-9.us-east-1.aws.neon.tech/beyond-branding?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function run() {
  console.log('Starting duplicate projects cleanup migration...');
  try {
    // 1. Find duplicate project names per client
    const duplicates = await sql`
      SELECT client_id, LOWER(project_name) AS name_lower, COUNT(*) 
      FROM projects
      GROUP BY client_id, LOWER(project_name)
      HAVING COUNT(*) > 1
    `;

    console.log(`Found ${duplicates.length} duplicate project names.`);

    for (const dup of duplicates) {
      console.log(`Processing duplicates for client_id: ${dup.client_id}, name: "${dup.name_lower}"`);

      // Get all projects matching this client and name
      const projects = await sql`
        SELECT id, project_name FROM projects 
        WHERE client_id = ${dup.client_id} AND LOWER(project_name) = ${dup.name_lower}
        ORDER BY id ASC
      `;

      const mainProject = projects[0];
      const dupProjects = projects.slice(1);

      console.log(`Keeping main project ID: ${mainProject.id} ("${mainProject.project_name}")`);

      for (const dupProj of dupProjects) {
        console.log(`Merging duplicate project ID: ${dupProj.id} ("${dupProj.project_name}") into ${mainProject.id}`);

        // --- A. MERGE DEPARTMENTS ---
        const mainDepts = await sql`SELECT id, department_name FROM project_departments WHERE project_id = ${mainProject.id}`;
        const dupDepts = await sql`SELECT id, department_name, description FROM project_departments WHERE project_id = ${dupProj.id}`;

        for (const dDept of dupDepts) {
          const matchingMainDept = mainDepts.find(m => m.department_name.toLowerCase() === dDept.department_name.toLowerCase());
          if (matchingMainDept) {
            console.log(`  Department "${dDept.department_name}" already exists on main project. Re-mapping items to ID: ${matchingMainDept.id}`);
            // Re-map deliverables
            await sql`
              UPDATE project_deliverables 
              SET department_id = ${matchingMainDept.id}, project_id = ${mainProject.id}
              WHERE department_id = ${dDept.id}
            `;
            // Re-map tasks
            await sql`
              UPDATE tasks 
              SET department_id = ${matchingMainDept.id}, project_id = ${mainProject.id}
              WHERE department_id = ${dDept.id}
            `;
            // Delete duplicate department
            await sql`DELETE FROM project_departments WHERE id = ${dDept.id}`;
          } else {
            console.log(`  Moving department "${dDept.department_name}" to main project.`);
            await sql`
              UPDATE project_departments 
              SET project_id = ${mainProject.id} 
              WHERE id = ${dDept.id}
            `;
            await sql`
              UPDATE project_deliverables
              SET project_id = ${mainProject.id}
              WHERE department_id = ${dDept.id}
            `;
          }
        }

        // --- B. MERGE MEMBERS ---
        const mainMembers = await sql`SELECT employee_id FROM project_members WHERE project_id = ${mainProject.id}`;
        const dupMembers = await sql`SELECT employee_id, role_in_project FROM project_members WHERE project_id = ${dupProj.id}`;

        for (const dMem of dupMembers) {
          const isAlreadyMember = mainMembers.some(m => m.employee_id === dMem.employee_id);
          if (isAlreadyMember) {
            // Delete membership on duplicate project
            await sql`
              DELETE FROM project_members 
              WHERE project_id = ${dupProj.id} AND employee_id = ${dMem.employee_id}
            `;
          } else {
            // Re-link membership to main project
            await sql`
              UPDATE project_members 
              SET project_id = ${mainProject.id}
              WHERE project_id = ${dupProj.id} AND employee_id = ${dMem.employee_id}
            `;
          }
        }

        // --- C. MERGE OTHER ENTITIES ---
        // Deliverables not linked to any department
        await sql`
          UPDATE project_deliverables 
          SET project_id = ${mainProject.id} 
          WHERE project_id = ${dupProj.id}
        `;
        // Files
        await sql`
          UPDATE project_files 
          SET project_id = ${mainProject.id} 
          WHERE project_id = ${dupProj.id}
        `;
        // Notes
        await sql`
          UPDATE project_notes 
          SET project_id = ${mainProject.id} 
          WHERE project_id = ${dupProj.id}
        `;
        // Tasks not linked to a specific department
        await sql`
          UPDATE tasks 
          SET project_id = ${mainProject.id} 
          WHERE project_id = ${dupProj.id}
        `;

        // --- D. DELETE DUPLICATE PROJECT ---
        console.log(`  Deleting duplicate project ID: ${dupProj.id}`);
        await sql`DELETE FROM projects WHERE id = ${dupProj.id}`;
      }
    }

    // 2. Add Unique Constraint
    console.log('Adding unique constraint unique_client_project (client_id, project_name) to projects table...');
    await sql`
      ALTER TABLE projects 
      ADD CONSTRAINT unique_client_project UNIQUE (client_id, project_name)
    `;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
