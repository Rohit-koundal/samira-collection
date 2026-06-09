const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');
const { adminOnly } = require('./middleware/adminMiddleware');

const app = express();

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ message: 'Samira Collection API is running' }));
app.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Service is temporarily unavailable. Please try again in a few minutes.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.post('/api/admin/login', require('./controllers/authController').login);
app.use('/api/admin/customers', protect, adminOnly, require('./routes/customerAdminRoutes'));
app.use('/api/admin/users', protect, adminOnly, require('./routes/customerAdminRoutes'));
app.use('/api/admin', require('./routes/adminAuthRoutes'));
app.use('/api/admin/products', protect, adminOnly, require('./routes/productRoutes'));
app.use('/api/admin/categories', protect, adminOnly, require('./routes/categoryRoutes'));
app.use('/api/admin/orders', protect, adminOnly, require('./routes/orderRoutes'));
app.use('/api/admin/coupons', protect, adminOnly, require('./routes/couponRoutes'));
app.use('/api/admin/banners', protect, adminOnly, require('./routes/bannerRoutes'));
app.use('/api/admin/reviews', protect, adminOnly, require('./routes/reviewRoutes'));
app.use('/api/admin/returns', protect, adminOnly, require('./routes/returnRoutes'));
app.use('/api/admin/settings', protect, adminOnly, require('./routes/settingsRoutes'));
app.use('/api/admin/uploads', protect, adminOnly, require('./routes/uploadRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/user/addresses', require('./routes/addressRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
