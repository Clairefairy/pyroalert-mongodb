const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  const body = req.body;
  if (!body.device_id) return res.status(400).json({ message: 'device_id required' });
  const exists = await Device.findOne({ device_id: body.device_id });
  if (exists) return res.status(409).json({ message: 'device already exists' });
  const dev = await Device.create(body);
  res.status(201).json(dev);
});

router.get('/', auth, async (req, res) => {
  const devices = await Device.find().limit(200).exec();
  res.json(devices);
});

router.get('/:id', auth, async (req, res) => {
  const dev = await Device.findOne({ device_id: req.params.id }).exec();
  if (!dev) return res.status(404).json({ message: 'not found' });
  res.json(dev);
});

router.put('/:id', auth, async (req, res) => {
  const upd = await Device.findOneAndUpdate({ device_id: req.params.id }, req.body, { new: true }).exec();
  if (!upd) return res.status(404).json({ message: 'not found' });
  res.json(upd);
});

router.delete('/:id', auth, async (req, res) => {
  await Device.findOneAndDelete({ device_id: req.params.id }).exec();
  res.status(204).end();
});

module.exports = router;
