const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const DeviceModel = require('../models/Device');
const auth = require('../middleware/auth');

// Ingest telemetry (protected endpoint)
router.post('/', auth, async (req, res) => {
  const body = req.body;
  if (!body.device_id || !body.timestamp) return res.status(400).json({ message: 'device_id and timestamp required' });
  const t = await Telemetry.create({
    device_id: body.device_id,
    timestamp: new Date(body.timestamp),
    sensors: body.sensors || {},
    battery_v: body.battery_v,
    gateway: (body.metadata && body.metadata.gateway) || body.gateway,
    rssi: body.rssi,
    snr: body.snr,
    raw_payload: body.raw_payload
  });
  await DeviceModel.updateOne({ device_id: body.device_id }, { last_seen: new Date(body.timestamp), status: 'online' });
  res.status(201).json({ stored: true, id: t._id });
});

module.exports = router;
