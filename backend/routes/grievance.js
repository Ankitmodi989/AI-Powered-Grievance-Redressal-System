// routes/grievance.js
router.get('/my-grievances', authMiddleware, async (req, res) => {
  const grievances = await prisma.grievance.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(grievances);
});

router.post('/submit', authMiddleware, async (req, res) => {
  const grievance = await prisma.grievance.create({
    data: {
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority,
      region: req.body.region,
      userId: req.user.userId,
    }
  });
  res.json(grievance);
});