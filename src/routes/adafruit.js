const express = require('express');
const router = express.Router();
const adafruitController = require('../controllers/adafruitController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/adafruit/status:
 *   get:
 *     summary: Status dos feeds Adafruit IO
 *     description: Retorna os valores atuais de todos os feeds configurados
 *     tags: [Adafruit IO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status dos feeds
 */
router.get('/status', auth, adafruitController.status);

/**
 * @swagger
 * /api/v1/adafruit/feeds:
 *   get:
 *     summary: Configuração dos feeds
 *     description: Lista os feeds configurados para integração
 *     tags: [Adafruit IO]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de feeds
 */
router.get('/feeds', auth, adafruitController.feeds);

/**
 * @swagger
 * /api/v1/adafruit/sync/{deviceId}:
 *   post:
 *     summary: Sincronizar leituras (por ObjectId)
 *     description: Busca dados dos feeds e salva como leitura do dispositivo
 *     tags: [Adafruit IO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId do dispositivo
 *     responses:
 *       201:
 *         description: Leitura sincronizada com sucesso
 *       400:
 *         description: Erro na sincronização
 *       404:
 *         description: Dispositivo não encontrado
 */
router.post('/sync/:deviceId', auth, adafruitController.sync);

/**
 * @swagger
 * /api/v1/adafruit/sync/device/{device_id}:
 *   post:
 *     summary: Sincronizar leituras (por device_id)
 *     description: Busca dados dos feeds e salva como leitura do dispositivo
 *     tags: [Adafruit IO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo (ex PYRO-TEST-001)
 *     responses:
 *       201:
 *         description: Leitura sincronizada com sucesso
 *       400:
 *         description: Erro na sincronização
 *       404:
 *         description: Dispositivo não encontrado
 */
router.post('/sync/device/:device_id', auth, adafruitController.syncByDeviceId);

module.exports = router;

