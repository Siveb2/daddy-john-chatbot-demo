const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ onboarding_completed: false });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save user preferences
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      preferred_name,
      likes,
      turn_offs,
      curious_about,
      relationship_status,
      connection_type,
      additional_info
    } = req.body;

    // Check if preferences already exist
    const existingResult = await pool.query(
      'SELECT id FROM user_preferences WHERE user_id = $1',
      [req.user.userId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing preferences
      const result = await pool.query(`
        UPDATE user_preferences SET 
          preferred_name = $1,
          likes = $2,
          turn_offs = $3,
          curious_about = $4,
          relationship_status = $5,
          connection_type = $6,
          additional_info = $7,
          onboarding_completed = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $8
        RETURNING *
      `, [preferred_name, likes, turn_offs, curious_about, relationship_status, connection_type, additional_info, req.user.userId]);
      
      res.json(result.rows[0]);
    } else {
      // Create new preferences
      const result = await pool.query(`
        INSERT INTO user_preferences (
          user_id, preferred_name, likes, turn_offs, curious_about,
          relationship_status, connection_type, additional_info, onboarding_completed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        RETURNING *
      `, [req.user.userId, preferred_name, likes, turn_offs, curious_about, relationship_status, connection_type, additional_info]);
      
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;