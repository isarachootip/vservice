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
  console.log('Connected to svc OK');

  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
  );
  console.log('=== Tables in svc ===');
  res.rows.forEach(r => console.log(' -', r.table_name));

  // Check row counts
  console.log('\n=== Row counts ===');
  for (const row of res.rows) {
    try {
      const cnt = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(` - ${row.table_name}: ${cnt.rows[0].count} rows`);
    } catch(e) {
      console.log(` - ${row.table_name}: error - ${e.message}`);
    }
  }

  await client.end();
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
