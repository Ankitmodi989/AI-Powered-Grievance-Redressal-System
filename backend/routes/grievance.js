const express = require('express');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const { classifyWithML } = require('../services/mlService');

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
    let { description, category, priority, region } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ detail: 'Description is required.' });
    }

    // Auto-classify using Grievance_System_Project v2 if category or priority is missing
    if (!category || category === 'General' || !priority) {
      const ml = await classifyWithML(description);
      if (ml.is_valid_complaint) {
        if (!category || category === 'General') category = ml.category;
        if (!priority) priority = ml.priority;
      }
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

// GET /grievance/all (Admin only)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Access denied. Admin only.' });
    }

    const grievances = await prisma.grievance.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const formatted = grievances.map((g) => ({
      ...g,
      created_at: g.createdAt,
      user_id: g.userId,
      user_name: g.user?.name || null,
      user_email: g.user?.email || null,
      solution: g.solution || `**Short-term Action:** Acknowledge grievance and dispatch field team for inspection within 24 hours.\n**Long-term Solution:** Schedule required civil/maintenance work and monitor until citizen satisfaction.`,
      latitude: g.latitude || null,
      longitude: g.longitude || null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch all grievances error:', err);
    res.status(500).json({ detail: 'Failed to load grievances.' });
  }
});

// PUT /grievance/:id/status (Admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Access denied. Admin only.' });
    }

    const grievanceId = parseInt(req.params.id, 10);
    if (isNaN(grievanceId)) {
      return res.status(400).json({ detail: 'Invalid grievance ID.' });
    }

    const status = req.body?.status || req.query?.status;
    if (!status) {
      return res.status(400).json({ detail: 'Status is required.' });
    }

    const updated = await prisma.grievance.update({
      where: { id: grievanceId },
      data: { status },
    });

    res.json({
      ...updated,
      created_at: updated.createdAt,
      user_id: updated.userId,
    });
  } catch (err) {
    console.error('Update grievance status error:', err);
    res.status(500).json({ detail: 'Failed to update grievance status.' });
  }
});

module.exports = router;