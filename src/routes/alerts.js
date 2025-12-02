const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const q = {};
  if (req.query.device_id) q.device_id = req.query.device_id;
  const items = await Alert.find(q).limit(200).exec();
  res.json(items);
});

router.post('/', auth, async (req, res) => {
  const body = req.body;
  if (!body.alert_id || !body.device_id) return res.status(400).json({ message: 'alert_id and device_id required' });
  const a = await Alert.create(body);
  res.status(201).json(a);
});

router.post('/:id/ack', auth, async (req, res) => {
  const id = req.params.id;
  const upd = await Alert.findOneAndUpdate({ alert_id: id }, { status: 'acknowledged' }, { new: true }).exec();
  if (!upd) return res.status(404).json({ message: 'not found' });
  res.json(upd);
});

module.exports = router;
