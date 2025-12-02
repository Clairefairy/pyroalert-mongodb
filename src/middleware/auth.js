const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação OAuth2
 * Verifica o Bearer token e extrai informações do usuário
 */
const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'invalid_token',
      error_description: 'Token de acesso não fornecido' 
    });
  }
  
  const token = header.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role,
      scope: payload.scope ? payload.scope.split(' ') : ['read', 'write']
    };
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'invalid_token',
        error_description: 'Token expirado' 
      });
    }
    return res.status(401).json({ 
      error: 'invalid_token',
      error_description: 'Token inválido' 
    });
  }
};

/**
 * Middleware para verificar escopos OAuth2
 * Uso: requireScope('read', 'write')
 */
const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.user || !req.user.scope) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: 'Token não possui escopos necessários'
      });
    }
    
    const hasAllScopes = requiredScopes.every(scope => 
      req.user.scope.includes(scope)
    );
    
    if (!hasAllScopes) {
      return res.status(403).json({
        error: 'insufficient_scope',
        error_description: `Escopos necessários: ${requiredScopes.join(', ')}`
      });
    }
    
    next();
  };
};

module.exports = auth;
module.exports.requireScope = requireScope;
