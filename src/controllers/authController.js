const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

/**
 * PUT /api/v1/auth/me
 * Atualiza dados do perfil do usuário logado
 */
exports.updateProfile = async (req, res) => {
  const { name, phone, id_number } = req.body;
  
  const user = await User.findById(req.user.id).exec();
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'Usuário não encontrado' 
    });
  }
  
  // Atualizar apenas os campos permitidos
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (id_number !== undefined) user.id_number = id_number;
  
  try {
    await user.save();
    
    // Retornar usuário sem campos sensíveis
    const updatedUser = await User.findById(req.user.id).select('-passwordHash').exec();
    
    res.json({ 
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (err) {
    // Erro de validação (ex: CPF/CNPJ inválido)
    if (err.message) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    throw err;
  }
};

/**
 * PUT /api/v1/auth/password
 * Altera a senha do usuário logado
 */
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  
  // Validar campos obrigatórios
  if (!current_password || !new_password) {
    return res.status(400).json({ 
      success: false,
      message: 'Senha atual e nova senha são obrigatórias' 
    });
  }
  
  // Validar tamanho mínimo da nova senha
  if (new_password.length < 6) {
    return res.status(400).json({ 
      success: false,
      message: 'A nova senha deve ter no mínimo 6 caracteres' 
    });
  }
  
  const user = await User.findById(req.user.id).exec();
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'Usuário não encontrado' 
    });
  }
  
  // Verificar senha atual
  const isCurrentPasswordValid = await user.verifyPassword(current_password);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({ 
      success: false,
      message: 'Senha atual incorreta' 
    });
  }
  
  // Hash da nova senha
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
  user.passwordHash = await bcrypt.hash(new_password, saltRounds);
  await user.save();
  
  res.json({ 
    success: true,
    message: 'Senha alterada com sucesso'
  });
};

/**
 * PUT /api/v1/auth/email
 * Altera o email do usuário logado
 */
exports.changeEmail = async (req, res) => {
  const { new_email, password } = req.body;
  
  // Validar campos obrigatórios
  if (!new_email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Novo email e senha são obrigatórios' 
    });
  }
  
  const user = await User.findById(req.user.id).exec();
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'Usuário não encontrado' 
    });
  }
  
  // Verificar senha
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false,
      message: 'Senha incorreta' 
    });
  }
  
  // Verificar se novo email já está em uso
  const emailInUse = await User.findOne({ 
    email: new_email.toLowerCase().trim(),
    _id: { $ne: user._id }
  }).exec();
  
  if (emailInUse) {
    return res.status(409).json({ 
      success: false,
      message: 'Este email já está em uso' 
    });
  }
  
  // Atualizar email
  user.email = new_email;
  
  try {
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Email alterado com sucesso',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    if (err.message && err.message.includes('Email')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    throw err;
  }
};

/**
 * DELETE /api/v1/auth/me
 * Exclui a conta do usuário logado
 */
exports.deleteAccount = async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ 
      success: false,
      message: 'Senha é obrigatória para excluir a conta' 
    });
  }
  
  const user = await User.findById(req.user.id).exec();
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      message: 'Usuário não encontrado' 
    });
  }
  
  // Verificar senha
  const isPasswordValid = await user.verifyPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false,
      message: 'Senha incorreta' 
    });
  }
  
  // Revogar todos os refresh tokens do usuário
  try {
    const RefreshToken = require('../models/RefreshToken');
    await RefreshToken.revokeAllUserTokens(user._id);
  } catch (err) {
    // Ignora se não conseguir revogar tokens
  }
  
  // Excluir usuário
  await User.deleteOne({ _id: user._id });
  
  res.json({ 
    success: true,
    message: 'Conta excluída com sucesso'
  });
};

