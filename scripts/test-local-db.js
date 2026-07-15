const { Client } = require('pg');

async function main() {
  console.log('Testing connection to 10.77.3.87:5432...');
  const client = new Client({
    host: '10.77.3.87',
    port: 5432,
    user: 'myuser',
    password: 'mypassword',
    database: 'service_center',
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('Connected to 10.77.3.87 service_center database successfully!');
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    );
    console.log('=== Tables ===');
    res.rows.forEach(r => console.log(' -', r.table_name));
    await client.end();
  } catch (err) {
    console.error('ERROR connecting to 10.77.3.87:', err.message);
  }
}

main();
