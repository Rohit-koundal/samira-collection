const Banner = require('../models/Banner');
exports.getBanners = async (req, res) => res.json(await Banner.find({ isActive: true }).sort('displayOrder'));
exports.createBanner = async (req, res) => res.status(201).json(await Banner.create(req.body));
exports.updateBanner = async (req, res) => res.json(await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true }));
exports.deleteBanner = async (req, res) => { await Banner.findByIdAndDelete(req.params.id); res.json({ message: 'Banner deleted' }); };
