const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/telemetry:
 *   get:
 *     summary: Listar telemetria
 *     tags: [Telemetria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Lista de telemetria
 */
router.get('/', auth, telemetryController.getAll);

/**
 * @swagger
 * /api/v1/telemetry/latest/{device_id}:
 *   get:
 *     summary: Última telemetria do dispositivo
 *     tags: [Telemetria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Última telemetria
 *       404:
 *         description: Não encontrada
 */
router.get('/latest/:device_id', auth, telemetryController.getLatest);

/**
 * @swagger
 * /api/v1/telemetry:
 *   post:
 *     summary: Enviar telemetria
 *     tags: [Telemetria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Telemetry'
 *     responses:
 *       201:
 *         description: Telemetria armazenada
 */
router.post('/', auth, telemetryController.create);

module.exports = router;
