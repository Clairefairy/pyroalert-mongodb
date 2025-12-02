const Alert = require('../models/Alert');

/**
 * GET /api/v1/alerts
 * Lista alertas com filtros opcionais
 */
exports.getAll = async (req, res) => {
  const { device_id, status, severity, limit = 200 } = req.query;
  
  const query = {};
  if (device_id) query.device_id = device_id;
  if (status) query.status = status;
  if (severity) query.severity = severity;
  
  const alerts = await Alert.find(query)
    .limit(parseInt(limit))
    .sort({ created_at: -1 })
    .exec();
  
  res.json({ 
    success: true,
    count: alerts.length,
    data: alerts 
  });
};

/**
 * GET /api/v1/alerts/:id
 * Busca alerta por alert_id
 */
exports.getOne = async (req, res) => {
  const alert = await Alert.findOne({ alert_id: req.params.id }).exec();
  
  if (!alert) {
    return res.status(404).json({ 
      success: false,
      message: 'Alerta não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    data: alert 
  });
};

/**
 * POST /api/v1/alerts
 * Cria novo alerta
 */
exports.create = async (req, res) => {
  const { alert_id, device_id, severity, type, payload } = req.body;
  
  if (!alert_id || !device_id) {
    return res.status(400).json({ 
      success: false,
      message: 'alert_id e device_id são obrigatórios' 
    });
  }
  
  // Verificar se já existe
  const exists = await Alert.findOne({ alert_id }).exec();
  if (exists) {
    return res.status(409).json({ 
      success: false,
      message: 'Alerta já existe' 
    });
  }
  
  const alert = await Alert.create({
    alert_id,
    device_id,
    severity: severity || 'medium',
    type,
    payload,
    status: 'open'
  });
  
  res.status(201).json({ 
    success: true,
    message: 'Alerta criado',
    data: alert 
  });
};

/**
 * POST /api/v1/alerts/:id/ack
 * Reconhece um alerta
 */
exports.acknowledge = async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { alert_id: req.params.id }, 
    { status: 'acknowledged' }, 
    { new: true }
  ).exec();
  
  if (!alert) {
    return res.status(404).json({ 
      success: false,
      message: 'Alerta não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Alerta reconhecido',
    data: alert 
  });
};

/**
 * POST /api/v1/alerts/:id/close
 * Fecha um alerta
 */
exports.close = async (req, res) => {
  const alert = await Alert.findOneAndUpdate(
    { alert_id: req.params.id }, 
    { status: 'closed' }, 
    { new: true }
  ).exec();
  
  if (!alert) {
    return res.status(404).json({ 
      success: false,
      message: 'Alerta não encontrado' 
    });
  }
  
  res.json({ 
    success: true,
    message: 'Alerta fechado',
    data: alert 
  });
};

