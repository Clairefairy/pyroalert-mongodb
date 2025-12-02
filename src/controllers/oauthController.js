const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const { verifyLoginCode } = require('./twoFactorController');

/**
 * Gera access token JWT
 */
const generateAccessToken = (user, scope = ['read', 'write']) => {
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '900', 10);
  
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      scope: scope.join(' '),
      token_type: 'access_token'
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  
  return { token, expiresIn };
};

/**
 * POST /oauth/token
 * OAuth2 Token Endpoint
 * 
 * Suporta grant_type:
 * - password: login com email/senha
 * - refresh_token: renovar access token
 */
exports.token = async (req, res) => {
  const { grant_type, email, password, refresh_token, scope, totp_code } = req.body;
  
  // Validar grant_type
  if (!grant_type) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'O parâmetro grant_type é obrigatório'
    });
  }
  
  const requestedScope = scope ? scope.split(' ') : ['read', 'write'];
  
  // ==================== PASSWORD GRANT ====================
  if (grant_type === 'password') {
    if (!email || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Email e password são obrigatórios para grant_type=password'
      });
    }
    
    // Buscar usuário (incluindo campos 2FA)
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+twoFactorSecret')
      .exec();
      
    if (!user) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Credenciais inválidas'
      });
    }
    
    // Verificar senha
    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Credenciais inválidas'
      });
    }
    
    // ==================== VERIFICAÇÃO 2FA ====================
    if (user.twoFactorEnabled) {
      // Se 2FA está ativado mas não foi fornecido código
      if (!totp_code) {
        return res.status(400).json({
          error: 'mfa_required',
          error_description: 'Autenticação de dois fatores é necessária',
          mfa_required: true,
          mfa_type: 'totp'
        });
      }
      
      // Verificar código 2FA
      const is2FAValid = await verifyLoginCode(user, totp_code);
      if (!is2FAValid) {
        return res.status(401).json({
          error: 'invalid_grant',
          error_description: 'Código 2FA inválido'
        });
      }
    }
    
    // Gerar tokens
    const accessToken = generateAccessToken(user, requestedScope);
    const refreshTokenData = await RefreshToken.createForUser(user._id, {
      scope: requestedScope,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    return res.json({
      access_token: accessToken.token,
      token_type: 'Bearer',
      expires_in: accessToken.expiresIn,
      refresh_token: refreshTokenData.token,
      scope: requestedScope.join(' '),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  }
  
  // ==================== REFRESH TOKEN GRANT ====================
  if (grant_type === 'refresh_token') {
    if (!refresh_token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'O parâmetro refresh_token é obrigatório'
      });
    }
    
    // Verificar refresh token
    const storedToken = await RefreshToken.verifyToken(refresh_token);
    if (!storedToken) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Refresh token inválido ou expirado'
      });
    }
    
    const user = storedToken.user;
    if (!user) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Usuário não encontrado'
      });
    }
    
    // Usar scope do token original se não especificado
    const tokenScope = requestedScope.length ? requestedScope : storedToken.scope;
    
    // Revogar token antigo (rotação de refresh token)
    await RefreshToken.revokeToken(refresh_token);
    
    // Gerar novos tokens
    const accessToken = generateAccessToken(user, tokenScope);
    const newRefreshToken = await RefreshToken.createForUser(user._id, {
      scope: tokenScope,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    return res.json({
      access_token: accessToken.token,
      token_type: 'Bearer',
      expires_in: accessToken.expiresIn,
      refresh_token: newRefreshToken.token,
      scope: tokenScope.join(' ')
    });
  }
  
  // Grant type não suportado
  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: `O grant_type '${grant_type}' não é suportado. Use 'password' ou 'refresh_token'.`
  });
};

/**
 * POST /oauth/revoke
 * OAuth2 Token Revocation Endpoint (RFC 7009)
 */
exports.revoke = async (req, res) => {
  const { token, token_type_hint } = req.body;
  
  if (!token) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'O parâmetro token é obrigatório'
    });
  }
  
  // Tentar revogar como refresh token
  if (!token_type_hint || token_type_hint === 'refresh_token') {
    await RefreshToken.revokeToken(token);
  }
  
  // Resposta de sucesso (mesmo se token não existir, por segurança)
  return res.status(200).json({
    success: true,
    message: 'Token revogado com sucesso'
  });
};

/**
 * POST /oauth/revoke-all
 * Revoga todos os tokens do usuário (logout de todos os dispositivos)
 * Requer autenticação
 */
exports.revokeAll = async (req, res) => {
  await RefreshToken.revokeAllUserTokens(req.user.id);
  
  return res.json({
    success: true,
    message: 'Todos os tokens foram revogados'
  });
};

/**
 * GET /oauth/introspect
 * Token Introspection (RFC 7662)
 */
exports.introspect = async (req, res) => {
  const { token, token_type_hint } = req.body;
  
  if (!token) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'O parâmetro token é obrigatório'
    });
  }
  
  // Verificar se é um access token (JWT)
  if (!token_type_hint || token_type_hint === 'access_token') {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return res.json({
        active: true,
        token_type: 'Bearer',
        scope: payload.scope,
        client_id: 'default',
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat
      });
    } catch (err) {
      // Token JWT inválido, tentar como refresh token
    }
  }
  
  // Verificar se é um refresh token
  if (!token_type_hint || token_type_hint === 'refresh_token') {
    const storedToken = await RefreshToken.verifyToken(token);
    if (storedToken) {
      return res.json({
        active: true,
        token_type: 'refresh_token',
        scope: storedToken.scope.join(' '),
        client_id: storedToken.clientId,
        sub: storedToken.user._id.toString(),
        email: storedToken.user.email,
        exp: Math.floor(storedToken.expiresAt.getTime() / 1000),
        iat: Math.floor(storedToken.createdAt.getTime() / 1000)
      });
    }
  }
  
  // Token não encontrado ou inválido
  return res.json({ active: false });
};

