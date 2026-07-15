const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS from the start
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Routes
const memberRoutes = require('./routes/members');
const expenseRoutes = require('./routes/expenses');
const balanceRoutes = require('./routes/balances');

app.use('/api/members', memberRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
