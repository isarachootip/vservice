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

  // Users
  const users = await client.query('SELECT id, username, name, role, "branchId", "vendorId" FROM "User";');
  console.log('=== Users ===');
  users.rows.forEach(r => console.log(JSON.stringify(r)));

  // ProductTypes
  const pts = await client.query('SELECT * FROM "ProductType";');
  console.log('\n=== ProductTypes ===');
  pts.rows.forEach(r => console.log(JSON.stringify(r)));

  // Brands
  const brands = await client.query('SELECT * FROM "Brand";');
  console.log('\n=== Brands ===');
  brands.rows.forEach(r => console.log(JSON.stringify(r)));

  await client.end();
}

main().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
