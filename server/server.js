const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase, insertDefaultCategories, createAdminUser } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const bidRoutes = require('./routes/bids');
const productRoutes = require('./routes/products');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Marketplace API is running', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Marketplace API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      categories: '/api/categories',
      products: '/api/products',
      bids: '/api/bids',
      notifications: '/api/notifications'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    await insertDefaultCategories();
    await createAdminUser();
    
    console.log('Database initialized successfully');
    console.log('Default admin user created: admin@marketplace.com / admin123');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;