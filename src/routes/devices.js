const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/devices:
 *   get:
 *     summary: Listar dispositivos
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, maintenance]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 200
 *     responses:
 *       200:
 *         description: Lista de dispositivos
 */
router.get('/', auth, deviceController.getAll);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   get:
 *     summary: Buscar dispositivo
 *     tags: [Dispositivos]
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
 *         description: Dispositivo encontrado
 *       404:
 *         description: Não encontrado
 */
router.get('/:id', auth, deviceController.getOne);

/**
 * @swagger
 * /api/v1/devices:
 *   post:
 *     summary: Criar dispositivo
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
 *         description: Dispositivo criado
 *       409:
 *         description: Já existe
 */
router.post('/', auth, deviceController.create);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   put:
 *     summary: Atualizar dispositivo
 *     tags: [Dispositivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       200:
 *         description: Atualizado
 *       404:
 *         description: Não encontrado
 */
router.put('/:id', auth, deviceController.update);

/**
 * @swagger
 * /api/v1/devices/{id}:
 *   delete:
 *     summary: Remover dispositivo
 *     tags: [Dispositivos]
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
 *         description: Removido
 *       404:
 *         description: Não encontrado
 */
router.delete('/:id', auth, deviceController.remove);

module.exports = router;
