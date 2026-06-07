const router = require('express').Router();
const auth = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/profile', protect, auth.profile);
router.put('/profile', protect, auth.updateProfile);

module.exports = router;
