const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

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
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar usuário
 *     description: Cria um novo usuário no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               id_number:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, operator, viewer]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já existe
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Dados do usuário logado
 *     description: Retorna informações do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autenticado
 */
router.get('/me', auth, authController.me);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     summary: Atualizar perfil
 *     description: Atualiza dados do perfil do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo
 *               phone:
 *                 type: string
 *                 description: Telefone
 *               id_number:
 *                 type: string
 *                 description: CPF ou CNPJ
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
router.put('/me', auth, authController.updateProfile);

/**
 * @swagger
 * /api/v1/auth/password:
 *   put:
 *     summary: Alterar senha
 *     description: Altera a senha do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Senha atual
 *               new_password:
 *                 type: string
 *                 description: Nova senha (mínimo 6 caracteres)
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Senha atual incorreta
 */
router.put('/password', auth, authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/email:
 *   put:
 *     summary: Alterar email
 *     description: Altera o email do usuário logado (requer confirmação de senha)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_email, password]
 *             properties:
 *               new_email:
 *                 type: string
 *                 format: email
 *                 description: Novo email
 *               password:
 *                 type: string
 *                 description: Senha para confirmação
 *     responses:
 *       200:
 *         description: Email alterado com sucesso
 *       400:
 *         description: Email inválido
 *       401:
 *         description: Senha incorreta
 *       409:
 *         description: Email já está em uso
 */
router.put('/email', auth, authController.changeEmail);

/**
 * @swagger
 * /api/v1/auth/me:
 *   delete:
 *     summary: Excluir conta
 *     description: Exclui permanentemente a conta do usuário logado
 *     tags: [Autenticação]
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
 *                 description: Senha para confirmação
 *     responses:
 *       200:
 *         description: Conta excluída com sucesso
 *       401:
 *         description: Senha incorreta
 */
router.delete('/me', auth, authController.deleteAccount);

module.exports = router;
