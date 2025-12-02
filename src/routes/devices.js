const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     summary: Criar dispositivo
 *     description: Cadastra um novo dispositivo no sistema
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       201:
 *         description: Dispositivo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       400:
 *         description: device_id é obrigatório
 *       401:
 *         description: Token inválido ou ausente
 *       409:
 *         description: Dispositivo já existe
 */
router.post('/', auth, async (req, res) => {
  const body = req.body;
  if (!body.device_id) return res.status(400).json({ message: 'device_id required' });
  const exists = await Device.findOne({ device_id: body.device_id });
  if (exists) return res.status(409).json({ message: 'device already exists' });
  const dev = await Device.create(body);
  res.status(201).json(dev);
});

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Listar dispositivos
 *     description: Retorna lista de todos os dispositivos (máximo 200)
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Device'
 *       401:
 *         description: Token inválido ou ausente
 */
router.get('/', auth, async (req, res) => {
  const devices = await Device.find().limit(200).exec();
  res.json(devices);
});

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   get:
 *     summary: Buscar dispositivo
 *     description: Retorna um dispositivo pelo device_id
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo (device_id)
 *     responses:
 *       200:
 *         description: Dispositivo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       401:
 *         description: Token inválido ou ausente
 *       404:
 *         description: Dispositivo não encontrado
 */
router.get('/:id', auth, async (req, res) => {
  const dev = await Device.findOne({ device_id: req.params.id }).exec();
  if (!dev) return res.status(404).json({ message: 'not found' });
  res.json(dev);
});

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   put:
 *     summary: Atualizar dispositivo
 *     description: Atualiza dados de um dispositivo existente
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo (device_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       200:
 *         description: Dispositivo atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Device'
 *       401:
 *         description: Token inválido ou ausente
 *       404:
 *         description: Dispositivo não encontrado
 */
router.put('/:id', auth, async (req, res) => {
  const upd = await Device.findOneAndUpdate({ device_id: req.params.id }, req.body, { new: true }).exec();
  if (!upd) return res.status(404).json({ message: 'not found' });
  res.json(upd);
});

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   delete:
 *     summary: Remover dispositivo
 *     description: Remove um dispositivo do sistema
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo (device_id)
 *     responses:
 *       204:
 *         description: Dispositivo removido com sucesso
 *       401:
 *         description: Token inválido ou ausente
 */
router.delete('/:id', auth, async (req, res) => {
  await Device.findOneAndDelete({ device_id: req.params.id }).exec();
  res.status(204).end();
});

module.exports = router;
