require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const grievanceRoutes = require('./routes/grievance');
const aiRouter = require('./routes/ai')

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/grievance', grievanceRoutes);
app.use('/ai',aiRouter);

// simple health check
app.get('/', (req, res) => {
  res.json({ status: 'Backend is running' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});