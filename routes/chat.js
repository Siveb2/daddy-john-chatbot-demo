const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Load Daddy John system prompt from file
const DADDY_JOHN_PROMPT = fs.readFileSync(path.join(__dirname, '../prompts/daddy-john.txt'), 'utf8');

// Get current AI model info
router.get('/model-info', authenticateToken, async (req, res) => {
  try {
    res.json({ 
      model: process.env.AI_MODEL || 'cognitivecomputations/dolphin3.0-mistral-24b:free',
      provider: 'OpenRouter'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.userId, req.body.title || 'New Conversation']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    console.log('Received message request:', { conversationId: req.params.id, content: req.body.content });
    
    const { content } = req.body;
    const model = process.env.AI_MODEL || 'cognitivecomputations/dolphin3.0-mistral-24b:free';
    const conversationId = req.params.id;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Save user message
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'user', content]
    );

    // Get recent messages for context
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 20',
      [conversationId]
    );

    const recentMessages = messagesResult.rows.reverse();

    // Get conversation summary if exists
    const convResult = await pool.query(
      'SELECT summary FROM conversations WHERE id = $1',
      [conversationId]
    );
    const summary = convResult.rows[0]?.summary;

    // Get user preferences for personalization
    const prefsResult = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.userId]
    );
    const userPrefs = prefsResult.rows[0];

    // Prepare messages for OpenRouter
    const messages = [
      { role: 'system', content: DADDY_JOHN_PROMPT },
    ];

    // Add user preferences context if available
    if (userPrefs) {
      let prefsContext = `User preferences for personalization:\n`;
      if (userPrefs.preferred_name) prefsContext += `- Call them: ${userPrefs.preferred_name}\n`;
      if (userPrefs.likes) prefsContext += `- They enjoy: ${userPrefs.likes}\n`;
      if (userPrefs.turn_offs) prefsContext += `- Avoid: ${userPrefs.turn_offs}\n`;
      if (userPrefs.curious_about) prefsContext += `- They're curious about: ${userPrefs.curious_about}\n`;
      if (userPrefs.relationship_status) prefsContext += `- Relationship status: ${userPrefs.relationship_status}\n`;
      if (userPrefs.connection_type) prefsContext += `- Looking for: ${userPrefs.connection_type}\n`;
      if (userPrefs.additional_info) prefsContext += `- Additional info: ${userPrefs.additional_info}\n`;
      
      messages.push({ role: 'system', content: prefsContext });
    }

    if (summary) {
      messages.push({ role: 'system', content: `Previous conversation summary: ${summary}` });
    }

    recentMessages.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Call OpenRouter API
    console.log('Calling OpenRouter with model:', model);
    console.log('Messages count:', messages.length);
    
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages,
      max_tokens: 1000,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      throw new Error('Invalid response from OpenRouter API');
    }

    const assistantMessage = response.data.choices[0].message.content;

    // Save assistant message
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, model) VALUES ($1, $2, $3, $4)',
      [conversationId, 'assistant', assistantMessage, model]
    );

    // Update message count and check if summary needed
    const countResult = await pool.query(
      'UPDATE conversations SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING message_count',
      [conversationId]
    );

    const messageCount = countResult.rows[0].message_count;

    // Generate summary every 20 messages
    if (messageCount % 20 === 0) {
      await generateSummary(conversationId, model);
    }

    res.json({ content: assistantMessage, model });
  } catch (error) {
    console.error('Chat error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    let errorMessage = 'Failed to process message';
    let errorType = 'general';
    
    if (error.response?.status === 401) {
      errorMessage = 'API authentication failed';
      errorType = 'auth';
    } else if (error.response?.status === 429) {
      // Check if it's specifically about rate limits or credits
      const errorData = error.response?.data;
      if (errorData?.error?.message?.includes('Rate limit exceeded') || 
          errorData?.error?.message?.includes('free-models-per-day') ||
          errorData?.error?.message?.includes('credits')) {
        errorMessage = '💳 Daily free credits exhausted! The free model limit has been reached for today. Please try again tomorrow or add credits to your OpenRouter account.';
        errorType = 'credits';
      } else {
        errorMessage = 'Rate limit exceeded, please try again in a moment';
        errorType = 'rate_limit';
      }
    } else if (error.message.includes('OPENROUTER_API_KEY')) {
      errorMessage = 'API configuration error';
      errorType = 'config';
    }
    
    res.status(error.response?.status || 500).json({ 
      error: errorMessage,
      type: errorType,
      canRetry: errorType === 'rate_limit'
    });
  }
});

async function generateSummary(conversationId, model) {
  try {
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    const allMessages = messagesResult.rows;
    const conversationText = allMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const summaryResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences, focusing on key topics and context that would be important for continuing the conversation.'
        },
        {
          role: 'user',
          content: conversationText
        }
      ],
      max_tokens: 200,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const summary = summaryResponse.data.choices[0].message.content;

    await pool.query(
      'UPDATE conversations SET summary = $1 WHERE id = $2',
      [summary, conversationId]
    );
  } catch (error) {
    console.error('Summary generation failed:', error);
  }
}

module.exports = router;