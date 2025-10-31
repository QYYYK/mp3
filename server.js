// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Routes
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
