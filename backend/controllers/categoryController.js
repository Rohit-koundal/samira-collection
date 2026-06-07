const Category = require('../models/Category');
const slugify = require('../utils/slugify');

exports.getCategories = async (req, res) => res.json(await Category.find({ isActive: true }).sort('displayOrder'));
exports.createCategory = async (req, res) => res.status(201).json(await Category.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) }));
exports.updateCategory = async (req, res) => res.json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
exports.deleteCategory = async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.json({ message: 'Category deleted' }); };
