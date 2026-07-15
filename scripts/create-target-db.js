const { Client } = require('pg');

async function main() {
  console.log('Connecting to 187.77.147.16/postgres...');
  const client = new Client({
    host: '187.77.147.16',
    port: 5432,
    user: 'postgres',
    password: 'EsQShpeaGvSr21I5ieQGJRmCELp78GSlQn6hQHAIjbTnY4c1aWw56JleGierEk2t',
    database: 'postgres',
  });

  try {
    await client.connect();
    
    // Check if service_center database exists
    const checkDb = await client.query("SELECT 1 FROM pg_database WHERE datname='service_center';");
    if (checkDb.rows.length === 0) {
      console.log('Creating database service_center on 187.77.147.16...');
      await client.query('CREATE DATABASE service_center;');
      console.log('Database service_center created successfully!');
    } else {
      console.log('Database service_center already exists on 187.77.147.16.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await client.end();
  }
}

main();
