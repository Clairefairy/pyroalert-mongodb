const Device = require('../models/Device');

/**
 * GET /api/v1/devices
 * Lista todos os dispositivos
 */
exports.getAll = async (req, res) => {
  const { status, limit = 200 } = req.query;
  
  const query = {};
  if (status) query.status = status;
  
  const devices = await Device.find(query)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .exec();
  
  res.json({ 
    success: true,
    count: devices.length,
    data: devices 
  });
};

/**
 * GET /api/v1/devices/:id
 * Busca dispositivo por device_id
 */
exports.getOne = async (req, res) => {
  const device = await Device.findOne({ device_id: req.params.id }).exec();
  
  if (!device) {
    return res.status(404).json({ 
      success: false,
      message: 'Dispositivo não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    data: device 
  });
};

/**
 * POST /api/v1/devices
 * Cria novo dispositivo
 */
exports.create = async (req, res) => {
  const { device_id, dev_eui, model, location, metadata } = req.body;
  
  if (!device_id) {
    return res.status(400).json({ 
      success: false,
      message: 'device_id é obrigatório' 
    });
  }
  
  // Verificar se já existe
  const exists = await Device.findOne({ device_id }).exec();
  if (exists) {
    return res.status(409).json({ 
      success: false,
      message: 'Dispositivo já existe' 
    });
  }
  
  const device = await Device.create({
    device_id,
    dev_eui,
    model,
    location,
    metadata,
    status: 'offline'
  });
  
  res.status(201).json({ 
    success: true,
    message: 'Dispositivo criado com sucesso',
    data: device 
  });
};

/**
 * PUT /api/v1/devices/:id
 * Atualiza dispositivo
 */
exports.update = async (req, res) => {
  const device = await Device.findOneAndUpdate(
    { device_id: req.params.id }, 
    req.body, 
    { new: true, runValidators: true }
  ).exec();
  
  if (!device) {
    return res.status(404).json({ 
      success: false,
      message: 'Dispositivo não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Dispositivo atualizado',
    data: device 
  });
};

/**
 * DELETE /api/v1/devices/:id
 * Remove dispositivo
 */
exports.remove = async (req, res) => {
  const device = await Device.findOneAndDelete({ device_id: req.params.id }).exec();
  
  if (!device) {
    return res.status(404).json({ 
      success: false,
      message: 'Dispositivo não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Dispositivo removido' 
  });
};

