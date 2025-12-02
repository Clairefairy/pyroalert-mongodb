const User = require('../models/User');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Configuração do authenticator
authenticator.options = {
  digits: 6,
  step: 30, // 30 segundos
  window: 1 // Aceita código anterior/posterior (tolerância de 30s)
};

const APP_NAME = process.env.APP_NAME || 'PyroAlert';

/**
 * Gera códigos de recuperação seguros
 */
const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Gera código no formato XXXX-XXXX-XXXX
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    codes.push({ code: formatted, used: false });
  }
  return codes;
};

/**
 * Hash de código de recuperação para armazenamento seguro
 */
const hashRecoveryCode = (code) => {
  return crypto.createHash('sha256').update(code.replace(/-/g, '')).digest('hex');
};

/**
 * POST /api/v1/2fa/setup
 * Inicia o processo de configuração do 2FA
 * Retorna QR code e secret para o usuário configurar no app
 */
exports.setup = async (req, res) => {
  const user = await User.findById(req.user.id).select('+twoFactorSecret +twoFactorPendingSecret');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  if (user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA já está ativado. Desative primeiro para reconfigurar.'
    });
  }
  
  // Gera novo secret
  const secret = authenticator.generateSecret();
  
  // Salva temporariamente até confirmação
  user.twoFactorPendingSecret = secret;
  await user.save();
  
  // Gera URL otpauth para o QR code
  const otpauthUrl = authenticator.keyuri(user.email, APP_NAME, secret);
  
  // Gera QR code como data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  
  res.json({
    success: true,
    message: 'Configure seu app autenticador com o QR code ou chave manual',
    data: {
      qrCode: qrCodeDataUrl,
      secret: secret, // Para entrada manual
      otpauthUrl: otpauthUrl,
      instructions: [
        '1. Abra seu app autenticador (Google Authenticator, Authy, etc.)',
        '2. Escaneie o QR code ou digite a chave manualmente',
        '3. Digite o código de 6 dígitos gerado para confirmar'
      ]
    }
  });
};

/**
 * POST /api/v1/2fa/verify
 * Verifica o código TOTP e ativa o 2FA
 */
exports.verify = async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Código é obrigatório'
    });
  }
  
  const user = await User.findById(req.user.id).select('+twoFactorSecret +twoFactorPendingSecret');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  if (user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA já está ativado'
    });
  }
  
  if (!user.twoFactorPendingSecret) {
    return res.status(400).json({
      success: false,
      message: 'Inicie o setup do 2FA primeiro (POST /api/v1/2fa/setup)'
    });
  }
  
  // Verifica o código
  const isValid = authenticator.verify({
    token: code.replace(/\s/g, ''),
    secret: user.twoFactorPendingSecret
  });
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Código inválido. Verifique se o horário do seu dispositivo está correto.'
    });
  }
  
  // Gera códigos de recuperação
  const recoveryCodes = generateRecoveryCodes(10);
  const recoveryCodesHashed = recoveryCodes.map(rc => ({
    code: hashRecoveryCode(rc.code),
    used: false
  }));
  
  // Ativa 2FA
  user.twoFactorEnabled = true;
  user.twoFactorSecret = user.twoFactorPendingSecret;
  user.twoFactorPendingSecret = undefined;
  user.recoveryCodes = recoveryCodesHashed;
  await user.save();
  
  res.json({
    success: true,
    message: '2FA ativado com sucesso!',
    data: {
      recoveryCodes: recoveryCodes.map(rc => rc.code),
      warning: 'IMPORTANTE: Guarde estes códigos de recuperação em local seguro. Cada código só pode ser usado uma vez. Se perder acesso ao seu app autenticador, você precisará deles para acessar sua conta.'
    }
  });
};

/**
 * POST /api/v1/2fa/disable
 * Desativa o 2FA (requer código atual ou código de recuperação)
 */
exports.disable = async (req, res) => {
  const { code, password } = req.body;
  
  if (!code || !password) {
    return res.status(400).json({
      success: false,
      message: 'Código 2FA e senha são obrigatórios'
    });
  }
  
  const user = await User.findById(req.user.id).select('+twoFactorSecret +passwordHash');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  if (!user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA não está ativado'
    });
  }
  
  // Verifica senha
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Senha incorreta'
    });
  }
  
  // Verifica código TOTP
  const cleanCode = code.replace(/[\s-]/g, '');
  let isCodeValid = false;
  
  // Tenta verificar como código TOTP (6 dígitos)
  if (cleanCode.length === 6) {
    isCodeValid = authenticator.verify({
      token: cleanCode,
      secret: user.twoFactorSecret
    });
  }
  
  // Se não for TOTP válido, tenta como código de recuperação
  if (!isCodeValid) {
    const codeHash = hashRecoveryCode(code);
    const recoveryCode = user.recoveryCodes.find(
      rc => rc.code === codeHash && !rc.used
    );
    
    if (recoveryCode) {
      isCodeValid = true;
      recoveryCode.used = true;
      recoveryCode.usedAt = new Date();
    }
  }
  
  if (!isCodeValid) {
    return res.status(400).json({
      success: false,
      message: 'Código inválido'
    });
  }
  
  // Desativa 2FA
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorPendingSecret = undefined;
  user.recoveryCodes = [];
  await user.save();
  
  res.json({
    success: true,
    message: '2FA desativado com sucesso'
  });
};

/**
 * GET /api/v1/2fa/status
 * Retorna o status do 2FA para o usuário
 */
exports.status = async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  const unusedCodes = user.recoveryCodes ? 
    user.recoveryCodes.filter(rc => !rc.used).length : 0;
  
  res.json({
    success: true,
    data: {
      enabled: user.twoFactorEnabled,
      recoveryCodesRemaining: unusedCodes
    }
  });
};

/**
 * POST /api/v1/2fa/recovery-codes
 * Gera novos códigos de recuperação (invalida os anteriores)
 */
exports.regenerateRecoveryCodes = async (req, res) => {
  const { code, password } = req.body;
  
  if (!code || !password) {
    return res.status(400).json({
      success: false,
      message: 'Código 2FA e senha são obrigatórios'
    });
  }
  
  const user = await User.findById(req.user.id).select('+twoFactorSecret +passwordHash');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuário não encontrado'
    });
  }
  
  if (!user.twoFactorEnabled) {
    return res.status(400).json({
      success: false,
      message: '2FA não está ativado'
    });
  }
  
  // Verifica senha
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Senha incorreta'
    });
  }
  
  // Verifica código TOTP
  const isCodeValid = authenticator.verify({
    token: code.replace(/\s/g, ''),
    secret: user.twoFactorSecret
  });
  
  if (!isCodeValid) {
    return res.status(400).json({
      success: false,
      message: 'Código 2FA inválido'
    });
  }
  
  // Gera novos códigos de recuperação
  const recoveryCodes = generateRecoveryCodes(10);
  const recoveryCodesHashed = recoveryCodes.map(rc => ({
    code: hashRecoveryCode(rc.code),
    used: false
  }));
  
  user.recoveryCodes = recoveryCodesHashed;
  await user.save();
  
  res.json({
    success: true,
    message: 'Novos códigos de recuperação gerados',
    data: {
      recoveryCodes: recoveryCodes.map(rc => rc.code),
      warning: 'Os códigos anteriores foram invalidados. Guarde estes novos códigos em local seguro.'
    }
  });
};

/**
 * Função helper para verificar código 2FA durante login
 * Usada pelo oauthController
 */
exports.verifyLoginCode = async (user, code) => {
  if (!code) return false;
  
  const cleanCode = code.replace(/[\s-]/g, '');
  
  // Tenta verificar como código TOTP (6 dígitos)
  if (cleanCode.length === 6) {
    const isValid = authenticator.verify({
      token: cleanCode,
      secret: user.twoFactorSecret
    });
    if (isValid) return true;
  }
  
  // Tenta como código de recuperação
  const codeHash = hashRecoveryCode(code);
  const recoveryCode = user.recoveryCodes.find(
    rc => rc.code === codeHash && !rc.used
  );
  
  if (recoveryCode) {
    recoveryCode.used = true;
    recoveryCode.usedAt = new Date();
    await user.save();
    return true;
  }
  
  return false;
};

