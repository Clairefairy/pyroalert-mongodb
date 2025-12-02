const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Verifica se a API e banco de dados estão funcionando
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Sistema funcionando
 */
router.get('/', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({ 
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

module.exports = router;
