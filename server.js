require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { redirectLink } = require('./controllers/linkController');

const app = express();

// CORS Configuration
const corsOptions = {
  // origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  origin: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://snip-ly-frontend.vercel.app'
],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/links', require('./routes/links'));

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Redirect handler - MUST BE LAST (after all /api routes)
app.get('/:shortId', redirectLink);

const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
