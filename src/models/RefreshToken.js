const { Schema, model } = require('mongoose');
const crypto = require('crypto');

/**
 * RefreshToken schema para OAuth2
 * - token: o refresh token (hash)
 * - user: referência ao usuário
 * - expiresAt: data de expiração
 * - revoked: se foi revogado
 * - clientId: identificador do cliente (opcional)
 * - scope: escopos autorizados
 */

const RefreshTokenSchema = new Schema({
  token: { type: String, required: true, unique: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  revokedAt: { type: Date },
  clientId: { type: String, default: 'default' },
  scope: { type: [String], default: ['read', 'write'] },
  userAgent: { type: String },
  ipAddress: { type: String }
}, { timestamps: true });

// Índice para limpeza automática de tokens expirados
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Gerar um refresh token seguro
RefreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(64).toString('hex');
};

// Criar novo refresh token para usuário
RefreshTokenSchema.statics.createForUser = async function(userId, options = {}) {
  const token = this.generateToken();
  const expiresInDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  
  const refreshToken = new this({
    token,
    user: userId,
    expiresAt,
    clientId: options.clientId || 'default',
    scope: options.scope || ['read', 'write'],
    userAgent: options.userAgent,
    ipAddress: options.ipAddress
  });
  
  await refreshToken.save();
  return { token, expiresAt };
};

// Verificar e retornar refresh token válido
RefreshTokenSchema.statics.verifyToken = async function(token) {
  const refreshToken = await this.findOne({ 
    token, 
    revoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('user', '-passwordHash');
  
  return refreshToken;
};

// Revogar um token específico
RefreshTokenSchema.statics.revokeToken = async function(token) {
  return this.updateOne(
    { token },
    { revoked: true, revokedAt: new Date() }
  );
};

// Revogar todos os tokens de um usuário
RefreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
  return this.updateMany(
    { user: userId, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
};

module.exports = model('RefreshToken', RefreshTokenSchema);

