const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/readings:
 *   get:
 *     summary: Listar leituras
 *     description: Lista leituras com filtros opcionais por dispositivo e período
 *     tags: [Leituras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: ID do dispositivo
 *       - in: query
 *         name: device
 *         schema:
 *           type: string
 *         description: ObjectId do dispositivo
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial (ISO 8601)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limite de resultados
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pular N resultados (paginação)
 *     responses:
 *       200:
 *         description: Lista de leituras
 */
router.get('/', auth, readingController.list);

/**
 * @swagger
 * /api/v1/readings:
 *   post:
 *     summary: Criar leitura manualmente
 *     description: Registra uma nova leitura de sensores
 *     tags: [Leituras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReadingInput'
 *     responses:
 *       201:
 *         description: Leitura registrada
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Dispositivo não encontrado
 */
router.post('/', auth, readingController.create);

/**
 * @swagger
 * /api/v1/readings/from-api:
 *   post:
 *     summary: Criar leitura da API do dispositivo
 *     description: |
 *       Registra leitura a partir dos dados da API do dispositivo.
 *       Corrige automaticamente o fuso horário (API está 3h adiantada).
 *       
 *       Formato esperado para cada sensor:
 *       ```json
 *       {
 *         "last_value": 25.5,
 *         "updated_at": "2025-12-05T14:41:57Z"
 *       }
 *       ```
 *     tags: [Leituras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReadingFromApiInput'
 *     responses:
 *       201:
 *         description: Leitura registrada (horário corrigido)
 *       404:
 *         description: Dispositivo não encontrado
 */
router.post('/from-api', auth, readingController.createFromApi);

/**
 * @swagger
 * /api/v1/readings/device/{device_id}/latest:
 *   get:
 *     summary: Última leitura do dispositivo
 *     description: Retorna a leitura mais recente de um dispositivo
 *     tags: [Leituras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo
 *     responses:
 *       200:
 *         description: Última leitura
 *       404:
 *         description: Dispositivo ou leitura não encontrado
 */
router.get('/device/:device_id/latest', auth, readingController.getLatest);

/**
 * @swagger
 * /api/v1/readings/device/{device_id}/history:
 *   get:
 *     summary: Histórico de leituras
 *     description: Retorna histórico de leituras de um dispositivo
 *     tags: [Leituras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: device_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do dispositivo
 *       - in: query
 *         name: sensor
 *         schema:
 *           type: string
 *           enum: [smoke, sense, temp, humid, moist]
 *         description: Filtrar por sensor específico
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Histórico de leituras
 *       404:
 *         description: Dispositivo não encontrado
 */
router.get('/device/:device_id/history', auth, readingController.getHistory);

/**
 * @swagger
 * /api/v1/readings/{id}:
 *   get:
 *     summary: Buscar leitura por ID
 *     description: Retorna uma leitura específica
 *     tags: [Leituras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ObjectId da leitura
 *     responses:
 *       200:
 *         description: Leitura encontrada
 *       404:
 *         description: Leitura não encontrada
 */
router.get('/:id', auth, readingController.get);

/**
 * @swagger
 * /api/v1/readings/{id}:
 *   delete:
 *     summary: Excluir leitura
 *     description: Remove uma leitura do banco de dados
 *     tags: [Leituras]
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
 *         description: Leitura excluída
 *       404:
 *         description: Leitura não encontrada
 */
router.delete('/:id', auth, readingController.delete);

module.exports = router;

