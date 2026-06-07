const Product = require('../models/Product');
const slugify = require('../utils/slugify');

exports.getProducts = async (req, res) => {
  const query = { isActive: true };
  if (req.query.category) query.category = req.query.category;
  const products = await Product.find(query).populate('category').sort('-createdAt');
  res.json(products);
};

exports.getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

exports.createProduct = async (req, res) => {
  const product = await Product.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
  res.status(201).json(product);
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json(product);
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
};

exports.updateStatus = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json(product);
};

exports.updateStock = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { stock: req.body.stock }, { new: true });
  res.json(product);
};
