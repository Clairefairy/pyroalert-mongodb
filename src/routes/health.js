const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Verifica se a API está funcionando
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: API funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 time:
 *                   type: string
 *                   format: date-time
 */
router.get('/', async (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = router;
