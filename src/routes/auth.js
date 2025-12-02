const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     description: Realiza login e retorna um token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Username e password são obrigatórios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  const user = await User.findOne({ username }).exec();
  if (!user) return res.status(401).json({ message: 'invalid credentials' });
  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ message: 'invalid credentials' });
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '900', 10);
  const token = jwt.sign({ sub: user._id.toString(), username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn });
  res.json({ access_token: token, expires_in: expiresIn });
});

module.exports = router;
