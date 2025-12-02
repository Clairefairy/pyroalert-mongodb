const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: Listar alertas
 *     description: Retorna lista de alertas (máximo 200). Pode filtrar por device_id.
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Filtrar por ID do dispositivo
 *     responses:
 *       200:
 *         description: Lista de alertas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Alert'
 *       401:
 *         description: Token inválido ou ausente
 */
router.get('/', auth, async (req, res) => {
  const q = {};
  if (req.query.device_id) q.device_id = req.query.device_id;
  const items = await Alert.find(q).limit(200).exec();
  res.json(items);
});

/**
 * @swagger
 * /api/v1/alerts:
 *   post:
 *     summary: Criar alerta
 *     description: Registra um novo alerta no sistema
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Alert'
 *     responses:
 *       201:
 *         description: Alerta criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alert'
 *       400:
 *         description: alert_id e device_id são obrigatórios
 *       401:
 *         description: Token inválido ou ausente
 */
router.post('/', auth, async (req, res) => {
  const body = req.body;
  if (!body.alert_id || !body.device_id) return res.status(400).json({ message: 'alert_id and device_id required' });
  const a = await Alert.create(body);
  res.status(201).json(a);
});

/**
 * @swagger
 * /api/v1/alerts/{id}/ack:
 *   post:
 *     summary: Reconhecer alerta
 *     description: Marca um alerta como reconhecido (acknowledged)
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do alerta (alert_id)
 *     responses:
 *       200:
 *         description: Alerta reconhecido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alert'
 *       401:
 *         description: Token inválido ou ausente
 *       404:
 *         description: Alerta não encontrado
 */
router.post('/:id/ack', auth, async (req, res) => {
  const id = req.params.id;
  const upd = await Alert.findOneAndUpdate({ alert_id: id }, { status: 'acknowledged' }, { new: true }).exec();
  if (!upd) return res.status(404).json({ message: 'not found' });
  res.json(upd);
});

module.exports = router;
