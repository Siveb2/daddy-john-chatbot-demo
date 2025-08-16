require('dotenv').config();
const pool = require('../config/database');

async function addPreferencesTable() {
  try {
    // User preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        preferred_name VARCHAR(100),
        likes TEXT,
        dislikes TEXT,
        turn_offs TEXT,
        curious_about TEXT,
        relationship_status VARCHAR(50),
        connection_type VARCHAR(100),
        additional_info TEXT,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('User preferences table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create preferences table:', error);
    process.exit(1);
  }
}

addPreferencesTable();