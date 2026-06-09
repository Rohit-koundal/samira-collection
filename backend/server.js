const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { protect } = require('./middleware/authMiddleware');
const { adminOnly } = require('./middleware/adminMiddleware');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => res.json({ message: 'Samira Collection API is running' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.post('/api/admin/login', require('./controllers/authController').login);
app.use('/api/admin/customers', protect, adminOnly, require('./routes/customerAdminRoutes'));
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
