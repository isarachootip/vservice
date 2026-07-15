const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '187.77.147.16',
    port: 5432,
    user: 'postgres',
    password: 'EsQShpeaGvSr21I5ieQGJRmCELp78GSlQn6hQHAIjbTnY4c1aWw56JleGierEk2t',
    database: 'svc',
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log('Connected to svc OK\n');

  // Get all tables
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
  );

  for (const row of tables.rows) {
    const tbl = row.table_name;
    console.log(`\n========== TABLE: ${tbl} ==========`);

    // Get columns
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position;
    `, [tbl]);
    
    cols.rows.forEach(c => {
      const nullable = c.is_nullable === 'YES' ? '?' : '';
      const maxLen = c.character_maximum_length ? `(${c.character_maximum_length})` : '';
      const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
      console.log(`  ${c.column_name}${nullable}: ${c.data_type}${maxLen}${def}`);
    });

    // Get primary keys
    const pk = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name=$1 AND tc.table_schema='public';
    `, [tbl]);
    if (pk.rows.length) {
      console.log(`  PK: ${pk.rows.map(r => r.column_name).join(', ')}`);
    }

    // Get foreign keys
    const fk = await client.query(`
      SELECT kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name=$1 AND tc.table_schema='public';
    `, [tbl]);
    if (fk.rows.length) {
      fk.rows.forEach(f => {
        console.log(`  FK: ${f.column_name} -> ${f.foreign_table}(${f.foreign_column})`);
      });
    }
  }

  await client.end();
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
