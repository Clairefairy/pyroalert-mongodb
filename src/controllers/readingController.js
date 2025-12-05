const Reading = require('../models/Reading');
const Device = require('../models/Device');

/**
 * GET /api/v1/readings
 * Lista leituras (com filtros opcionais)
 */
exports.list = async (req, res) => {
  const { device_id, device, limit = 100, skip = 0, start_date, end_date } = req.query;
  
  const filter = {};
  
  // Filtro por dispositivo (ObjectId ou device_id string)
  if (device) {
    filter.device = device;
  } else if (device_id) {
    const dev = await Device.findOne({ device_id }).exec();
    if (dev) {
      filter.device = dev._id;
    } else {
      return res.json({ success: true, readings: [], total: 0 });
    }
  }
  
  // Filtro por período
  if (start_date || end_date) {
    filter.createdAt = {};
    if (start_date) filter.createdAt.$gte = new Date(start_date);
    if (end_date) filter.createdAt.$lte = new Date(end_date);
  }
  
  const [readings, total] = await Promise.all([
    Reading.find(filter)
      .populate('device', 'device_id model location status')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .exec(),
    Reading.countDocuments(filter)
  ]);
  
  res.json({ 
    success: true, 
    readings,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip)
  });
};

/**
 * GET /api/v1/readings/:id
 * Busca uma leitura por ID
 */
exports.get = async (req, res) => {
  const reading = await Reading.findById(req.params.id)
    .populate('device', 'device_id model location status')
    .exec();
  
  if (!reading) {
    return res.status(404).json({ 
      success: false, 
      message: 'Leitura não encontrada' 
    });
  }
  
  res.json({ success: true, reading });
};

/**
 * POST /api/v1/readings
 * Cria uma nova leitura manualmente
 */
exports.create = async (req, res) => {
  const { device_id, smoke, sense, temp, humid, moist } = req.body;
  
  if (!device_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'device_id é obrigatório' 
    });
  }
  
  // Buscar dispositivo
  const device = await Device.findOne({ device_id }).exec();
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: 'Dispositivo não encontrado' 
    });
  }
  
  const reading = new Reading({
    device: device._id,
    smoke,
    sense,
    temp,
    humid,
    moist
  });
  
  await reading.save();
  
  // Atualiza last_seen do dispositivo
  device.last_seen = new Date();
  device.status = 'online';
  await device.save();
  
  res.status(201).json({ 
    success: true, 
    message: 'Leitura registrada com sucesso',
    reading 
  });
};

/**
 * POST /api/v1/readings/from-api
 * Cria leitura a partir dos dados da API do dispositivo
 * Corrige automaticamente o fuso horário (-3h)
 */
exports.createFromApi = async (req, res) => {
  const { device_id, smoke, sense, temp, humid, moist, raw } = req.body;
  
  if (!device_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'device_id é obrigatório' 
    });
  }
  
  // Buscar dispositivo
  const device = await Device.findOne({ device_id }).exec();
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: 'Dispositivo não encontrado' 
    });
  }
  
  // Usar método estático que corrige o fuso horário
  const reading = await Reading.createFromApiData(device._id, {
    smoke,
    sense,
    temp,
    humid,
    moist,
    raw
  });
  
  // Atualiza last_seen do dispositivo
  device.last_seen = new Date();
  device.status = 'online';
  await device.save();
  
  res.status(201).json({ 
    success: true, 
    message: 'Leitura registrada com sucesso (horário corrigido)',
    reading 
  });
};

/**
 * GET /api/v1/readings/device/:device_id/latest
 * Busca a última leitura de um dispositivo
 */
exports.getLatest = async (req, res) => {
  const { device_id } = req.params;
  
  const device = await Device.findOne({ device_id }).exec();
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: 'Dispositivo não encontrado' 
    });
  }
  
  const reading = await Reading.findOne({ device: device._id })
    .sort({ createdAt: -1 })
    .populate('device', 'device_id model location status')
    .exec();
  
  if (!reading) {
    return res.status(404).json({ 
      success: false, 
      message: 'Nenhuma leitura encontrada para este dispositivo' 
    });
  }
  
  res.json({ success: true, reading });
};

/**
 * GET /api/v1/readings/device/:device_id/history
 * Busca histórico de leituras de um dispositivo
 */
exports.getHistory = async (req, res) => {
  const { device_id } = req.params;
  const { limit = 100, skip = 0, start_date, end_date, sensor } = req.query;
  
  const device = await Device.findOne({ device_id }).exec();
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: 'Dispositivo não encontrado' 
    });
  }
  
  const filter = { device: device._id };
  
  // Filtro por período
  if (start_date || end_date) {
    filter.createdAt = {};
    if (start_date) filter.createdAt.$gte = new Date(start_date);
    if (end_date) filter.createdAt.$lte = new Date(end_date);
  }
  
  // Projeção para retornar apenas sensor específico
  let projection = {};
  if (sensor && ['smoke', 'sense', 'temp', 'humid', 'moist'].includes(sensor)) {
    projection = { [sensor]: 1, device: 1, createdAt: 1 };
  }
  
  const [readings, total] = await Promise.all([
    Reading.find(filter, projection)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .exec(),
    Reading.countDocuments(filter)
  ]);
  
  res.json({ 
    success: true, 
    device: {
      id: device._id,
      device_id: device.device_id,
      model: device.model,
      location: device.location
    },
    readings,
    total,
    limit: parseInt(limit),
    skip: parseInt(skip)
  });
};

/**
 * DELETE /api/v1/readings/:id
 * Exclui uma leitura
 */
exports.delete = async (req, res) => {
  const reading = await Reading.findByIdAndDelete(req.params.id).exec();
  
  if (!reading) {
    return res.status(404).json({ 
      success: false, 
      message: 'Leitura não encontrada' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Leitura excluída com sucesso' 
  });
};

