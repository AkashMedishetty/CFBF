const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Educational content server is running' });
});

app.listen(PORT, () => {
  console.log(`Educational content server running on port ${PORT}`);
});