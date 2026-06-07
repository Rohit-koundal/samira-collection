const Settings = require('../models/Settings');
exports.getSettings = async (req, res) => res.json((await Settings.findOne()) || await Settings.create({}));
exports.updateSettings = async (req, res) => res.json(await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true }));
