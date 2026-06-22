const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  database: process.env.DB_NAME || "votes",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  port: 5432,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        choice VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("Database table ready.");
  } finally {
    client.release();
  }
}

async function processVotes() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT choice, COUNT(*) as count FROM votes GROUP BY choice",
    );
    console.log("Current vote counts:");
    result.rows.forEach((row) => {
      console.log(`  ${row.choice}: ${row.count}`);
    });
  } finally {
    client.release();
  }
}

async function main() {
  console.log("Worker starting...");

  let retries = 10;
  while (retries > 0) {
    try {
      await initDB();
      break;
    } catch (err) {
      console.log(`DB not ready yet, retrying... (${retries} left)`);
      retries--;
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  setInterval(processVotes, 5000);
}

main();
