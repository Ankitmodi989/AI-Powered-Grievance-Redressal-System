const express = require('express');
const authMiddleware = require('../middleware/auth');
const { analyzeMessage } = require('../services/aiService');


const router = express.Router();

// POST /ai/chat
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ detail: 'Message text is required.' });
    }

    const result = await analyzeMessage(text);
    res.json(result);
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ detail: 'AI service is currently unavailable. Please try again.' });
  }
});

module.exports = router;