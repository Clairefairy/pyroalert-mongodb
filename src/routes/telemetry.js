const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');
const DeviceModel = require('../models/Device');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/telemetry:
 *   post:
 *     summary: Enviar telemetria
 *     description: Recebe dados de telemetria de um dispositivo e atualiza seu status
 *     tags: [Telemetria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - timestamp
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: PYRO-001
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T10:30:00Z
 *               sensors:
 *                 type: object
 *                 example: { temperature: 45.2, humidity: 30, smoke: 0.8 }
 *               battery_v:
 *                 type: number
 *                 example: 3.7
 *               gateway:
 *                 type: string
 *                 example: GW-001
 *               rssi:
 *                 type: number
 *                 example: -85
 *               snr:
 *                 type: number
 *                 example: 7.5
 *               raw_payload:
 *                 type: string
 *     responses:
 *       201:
 *         description: Telemetria armazenada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stored:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439011
 *       400:
 *         description: device_id e timestamp são obrigatórios
 *       401:
 *         description: Token inválido ou ausente
 */
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
