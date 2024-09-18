const { Pool } = require('pg');
require('dotenv').config(); // To use environment variables

// Create a new pool instance
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to the database
(async () => {
  try {
    await pool.connect();
    console.log('Connected to the database!');
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
})();

module.exports = pool;
