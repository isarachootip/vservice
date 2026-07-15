const { Client } = require('pg');

const sourceConfig = {
  host: '10.77.3.87',
  port: 5432,
  user: 'myuser',
  password: 'mypassword',
  database: 'service_center',
};

const targetConfig = {
  host: '187.77.147.16',
  port: 5432,
  user: 'postgres',
  password: 'EsQShpeaGvSr21I5ieQGJRmCELp78GSlQn6hQHAIjbTnY4c1aWw56JleGierEk2t',
  database: 'service_center',
};

// Order of deletion (child first, parent last)
const deleteOrder = [
  'transaction_log',
  'quotation',
  'repair_bundle_items',
  'repair_bundle_master',
  'repair_attachment',
  'repair_item',
  'repair_request',
  'user_roles_has_permission',
  'users',
  'user_roles',
  'commodity',
  'running_doc',
  'vendor_info',
  'status_info',
  'store',
  'permission'
];

// Order of insertion (parent first, child last)
const insertOrder = [...deleteOrder].reverse();

// Helper to escape table and column names
function escapeIdentifier(id) {
  return `"${id.replace(/"/g, '""')}"`;
}

async function cloneTable(sourceClient, targetClient, tableName) {
  console.log(`Cloning table "${tableName}"...`);
  
  // 1. Get source columns and data
  const dataRes = await sourceClient.query(`SELECT * FROM ${escapeIdentifier(tableName)}`);
  const rows = dataRes.rows;
  console.log(` - Found ${rows.length} rows in source`);

  if (rows.length === 0) {
    return;
  }

  const columns = Object.keys(rows[0]);
  const escapedColumns = columns.map(escapeIdentifier).join(', ');

  // 2. Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    // We construct a multi-row insert query:
    // INSERT INTO "table" ("col1", "col2") VALUES ($1, $2), ($3, $4), ...
    const valuePlaceholders = [];
    const queryValues = [];
    let paramIndex = 1;

    for (const row of batch) {
      const placeholders = [];
      for (const col of columns) {
        placeholders.push(`$${paramIndex++}`);
        queryValues.push(row[col]);
      }
      valuePlaceholders.push(`(${placeholders.join(', ')})`);
    }

    const insertQuery = `INSERT INTO ${escapeIdentifier(tableName)} (${escapedColumns}) VALUES ${valuePlaceholders.join(', ')}`;
    await targetClient.query(insertQuery, queryValues);
  }

  console.log(` - Successfully copied ${rows.length} rows to target`);

  // 3. Reset serial sequences if any
  try {
    const seqRes = await targetClient.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_default LIKE 'nextval%'
    `, [tableName]);

    for (const seqRow of seqRes.rows) {
      const colName = seqRow.column_name;
      console.log(` - Resetting sequence for column "${colName}"...`);
      await targetClient.query(`
        SELECT setval(
          pg_get_serial_sequence($1, $2), 
          COALESCE((SELECT MAX(${escapeIdentifier(colName)}) FROM ${escapeIdentifier(tableName)}), 1)
        )
      `, [tableName, colName]);
    }
  } catch (seqErr) {
    console.warn(` - Warning resetting sequence: ${seqErr.message}`);
  }
}

async function main() {
  const sourceClient = new Client(sourceConfig);
  const targetClient = new Client(targetConfig);

  try {
    console.log('Connecting to Source Database (10.77.3.87)...');
    await sourceClient.connect();
    
    console.log('Connecting to Target Database (187.77.147.16)...');
    await targetClient.connect();

    // Clear target tables first
    console.log('\nClearing target tables...');
    for (const table of deleteOrder) {
      console.log(` - Deleting all rows from "${table}"`);
      await targetClient.query(`DELETE FROM ${escapeIdentifier(table)}`);
    }

    // Clone each table
    console.log('\nStarting clone...');
    for (const table of insertOrder) {
      await cloneTable(sourceClient, targetClient, table);
    }

    console.log('\nDatabase cloning completed successfully!');
  } catch (err) {
    console.error('\nERROR during clone:', err);
  } finally {
    await sourceClient.end().catch(() => {});
    await targetClient.end().catch(() => {});
  }
}

main();
