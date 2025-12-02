const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * POST /api/v1/auth/login
 * Autentica usuário e retorna JWT
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'email e password são obrigatórios' 
    });
  }
  
  const user = await User.findOne({ email: email.toLowerCase().trim() }).exec();
  if (!user) {
    return res.status(401).json({ 
      success: false,
      message: 'Credenciais inválidas' 
    });
  }
  
  const isValid = await user.verifyPassword(password);
  if (!isValid) {
    return res.status(401).json({ 
      success: false,
      message: 'Credenciais inválidas' 
    });
  }
  
  const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '900', 10);
  const token = jwt.sign(
    { 
      sub: user._id.toString(), 
      email: user.email, 
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn }
  );
  
  res.json({ 
    success: true,
    access_token: token, 
    expires_in: expiresIn,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
};

/**
 * POST /api/v1/auth/register
 * Registra novo usuário
 */
exports.register = async (req, res) => {
  const { email, password, name, id_number, phone, role } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'email e password são obrigatórios' 
    });
  }
  
  // Verificar se usuário já existe
  const exists = await User.findOne({ email: email.toLowerCase().trim() }).exec();
  if (exists) {
    return res.status(409).json({ 
      success: false,
      message: 'Email já está em uso' 
    });
  }
  
  const user = await User.createWithPassword({ 
    email, 
    password, 
    name, 
    id_number, 
    phone, 
    role: role || 'viewer' 
  });
  
  res.status(201).json({ 
    success: true,
    message: 'Usuário criado com sucesso',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
};

/**
 * GET /api/v1/auth/me
 * Retorna dados do usuário logado
 */
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash').exec();
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'Usuário não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    user 
  });
};

