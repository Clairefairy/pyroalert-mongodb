const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/2fa/status:
 *   get:
 *     summary: Status do 2FA
 *     description: Retorna se o 2FA está ativado e quantos códigos de recuperação restam
 *     tags: [Two-Factor Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do 2FA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     recoveryCodesRemaining:
 *                       type: number
 */
router.get('/status', auth, twoFactorController.status);

/**
 * @swagger
 * /api/v1/2fa/setup:
 *   post:
 *     summary: Iniciar configuração do 2FA
 *     description: Gera um QR code e secret para configurar o app autenticador
 *     tags: [Two-Factor Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code e instruções para setup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TwoFactorSetupResponse'
 *       400:
 *         description: 2FA já está ativado
 */
router.post('/setup', auth, twoFactorController.setup);

/**
 * @swagger
 * /api/v1/2fa/verify:
 *   post:
 *     summary: Verificar e ativar 2FA
 *     description: Verifica o código TOTP do app e ativa o 2FA. Retorna códigos de recuperação.
 *     tags: [Two-Factor Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código de 6 dígitos do app autenticador
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA ativado com códigos de recuperação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TwoFactorVerifyResponse'
 *       400:
 *         description: Código inválido ou setup não iniciado
 */
router.post('/verify', auth, twoFactorController.verify);

/**
 * @swagger
 * /api/v1/2fa/disable:
 *   post:
 *     summary: Desativar 2FA
 *     description: Desativa a autenticação de dois fatores (requer código TOTP ou de recuperação + senha)
 *     tags: [Two-Factor Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, password]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código TOTP ou código de recuperação
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: 2FA desativado com sucesso
 *       400:
 *         description: Código inválido
 *       401:
 *         description: Senha incorreta
 */
router.post('/disable', auth, twoFactorController.disable);

/**
 * @swagger
 * /api/v1/2fa/recovery-codes:
 *   post:
 *     summary: Regenerar códigos de recuperação
 *     description: Gera novos códigos de recuperação (invalida os anteriores)
 *     tags: [Two-Factor Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, password]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código TOTP atual
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Novos códigos de recuperação gerados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecoveryCodesResponse'
 */
router.post('/recovery-codes', auth, twoFactorController.regenerateRecoveryCodes);

/**
 * @swagger
 * /api/v1/2fa:
 *   delete:
 *     summary: Remover 2FA (apenas com senha)
 *     description: |
 *       Remove a autenticação de dois fatores usando apenas a senha.
 *       
 *       **Use esta rota quando:**
 *       - Perdeu acesso ao app autenticador
 *       - Perdeu os códigos de recuperação
 *       - Precisa desativar o 2FA de emergência
 *     tags: [Two-Factor Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: Senha do usuário para confirmação
 *     responses:
 *       200:
 *         description: 2FA removido com sucesso
 *       400:
 *         description: 2FA não está ativado
 *       401:
 *         description: Senha incorreta
 */
router.delete('/', auth, twoFactorController.remove);

module.exports = router;

