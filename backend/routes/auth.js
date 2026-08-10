// routes/auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: 'user' }
  });
  const access_token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ access_token });
});