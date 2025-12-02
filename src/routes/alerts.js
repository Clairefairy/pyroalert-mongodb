const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: Listar alertas
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, acknowledged, closed]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 *     responses:
 *       200:
 *         description: Lista de alertas
 */
router.get('/', auth, alertController.getAll);

/**
 * @swagger
 * /api/v1/alerts/{id}:
 *   get:
 *     summary: Buscar alerta
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta encontrado
 *       404:
 *         description: Não encontrado
 */
router.get('/:id', auth, alertController.getOne);

/**
 * @swagger
 * /api/v1/alerts:
 *   post:
 *     summary: Criar alerta
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
 *         description: Alerta criado
 */
router.post('/', auth, alertController.create);

/**
 * @swagger
 * /api/v1/alerts/{id}/ack:
 *   post:
 *     summary: Reconhecer alerta
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta reconhecido
 *       404:
 *         description: Não encontrado
 */
router.post('/:id/ack', auth, alertController.acknowledge);

/**
 * @swagger
 * /api/v1/alerts/{id}/close:
 *   post:
 *     summary: Fechar alerta
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alerta fechado
 *       404:
 *         description: Não encontrado
 */
router.post('/:id/close', auth, alertController.close);

module.exports = router;
