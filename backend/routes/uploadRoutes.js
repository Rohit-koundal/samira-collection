const router = require('express').Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/', protect, adminOnly, upload.array('images', 8), (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const files = (req.files || []).map((file) => ({
    url: `${baseUrl}/uploads/${file.filename}`,
    publicId: file.filename,
    originalName: file.originalname,
  }));
  res.status(201).json({ files });
});

module.exports = router;
