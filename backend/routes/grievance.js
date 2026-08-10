const express = require('express');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /grievance/my-grievances
router.get('/my-grievances', authMiddleware, async (req, res) => {
  try {
    const grievances = await prisma.grievance.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    // Map createdAt -> created_at to match GrievanceList.tsx's expected field name
    const formatted = grievances.map((g) => ({
      ...g,
      created_at: g.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch grievances error:', err);
    res.status(500).json({ detail: 'Failed to load grievances.' });
  }
});

// POST /grievance/submit
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { description, category, priority, region } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ detail: 'Description is required.' });
    }

    const grievance = await prisma.grievance.create({
      data: {
        description,
        category: category || 'General',
        priority: priority || 'Normal',
        region: region || null,
        userId: req.user.userId,
      },
    });

    res.json({ ...grievance, created_at: grievance.createdAt });
  } catch (err) {
    console.error('Submit grievance error:', err);
    res.status(500).json({ detail: 'Failed to submit grievance.' });
  }
});

module.exports = router;