const express = require('express');
const router = express.Router();
const oauthController = require('../controllers/oauthController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /oauth/token:
 *   post:
 *     summary: Obter tokens OAuth2
 *     description: |
 *       Endpoint OAuth2 para obtenção de tokens.
 *       
 *       **Grant Types suportados:**
 *       - `password`: Login com email e senha
 *       - `refresh_token`: Renovar access token usando refresh token
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PasswordGrant'
 *               - $ref: '#/components/schemas/RefreshTokenGrant'
 *           examples:
 *             password:
 *               summary: Login com senha
 *               value:
 *                 grant_type: password
 *                 email: usuario@exemplo.com
 *                 password: senha123
 *             refresh:
 *               summary: Renovar token
 *               value:
 *                 grant_type: refresh_token
 *                 refresh_token: abc123...
 *     responses:
 *       200:
 *         description: Tokens gerados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Requisição inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthError'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthError'
 */
router.post('/token', oauthController.token);

/**
 * @swagger
 * /oauth/revoke:
 *   post:
 *     summary: Revogar token
 *     description: Revoga um refresh token (logout)
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: O token a ser revogado
 *               token_type_hint:
 *                 type: string
 *                 enum: [refresh_token, access_token]
 *                 description: Tipo do token (opcional)
 *     responses:
 *       200:
 *         description: Token revogado com sucesso
 */
router.post('/revoke', oauthController.revoke);

/**
 * @swagger
 * /oauth/revoke-all:
 *   post:
 *     summary: Revogar todos os tokens
 *     description: Revoga todos os refresh tokens do usuário (logout de todos os dispositivos)
 *     tags: [OAuth2]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todos os tokens revogados
 *       401:
 *         description: Não autenticado
 */
router.post('/revoke-all', auth, oauthController.revokeAll);

/**
 * @swagger
 * /oauth/introspect:
 *   post:
 *     summary: Introspecção de token
 *     description: Verifica se um token é válido e retorna suas informações
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *               token_type_hint:
 *                 type: string
 *                 enum: [access_token, refresh_token]
 *     responses:
 *       200:
 *         description: Informações do token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenIntrospection'
 */
router.post('/introspect', oauthController.introspect);

module.exports = router;

