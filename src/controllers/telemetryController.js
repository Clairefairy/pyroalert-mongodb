const Telemetry = require('../models/Telemetry');
const Device = require('../models/Device');

/**
 * GET /api/v1/telemetry
 * Lista telemetria com filtros
 */
exports.getAll = async (req, res) => {
  const { device_id, limit = 100 } = req.query;
  
  const query = {};
  if (device_id) query.device_id = device_id;
  
  const telemetry = await Telemetry.find(query)
    .limit(parseInt(limit))
    .sort({ timestamp: -1 })
    .exec();
  
  res.json({ 
    success: true,
    count: telemetry.length,
    data: telemetry 
  });
};

/**
 * GET /api/v1/telemetry/latest/:device_id
 * Retorna última telemetria de um dispositivo
 */
exports.getLatest = async (req, res) => {
  const telemetry = await Telemetry.findOne({ device_id: req.params.device_id })
    .sort({ timestamp: -1 })
    .exec();
  
  if (!telemetry) {
    return res.status(404).json({ 
      success: false,
      message: 'Nenhuma telemetria encontrada para este dispositivo' 
    });
  }
  
  res.json({ 
    success: true,
    data: telemetry 
  });
};

/**
 * POST /api/v1/telemetry
 * Recebe dados de telemetria
 */
exports.create = async (req, res) => {
  const { device_id, timestamp, sensors, battery_v, gateway, rssi, snr, raw_payload } = req.body;
  
  if (!device_id || !timestamp) {
    return res.status(400).json({ 
      success: false,
      message: 'device_id e timestamp são obrigatórios' 
    });
  }
  
  const telemetry = await Telemetry.create({
    device_id,
    timestamp: new Date(timestamp),
    sensors: sensors || {},
    battery_v,
    gateway,
    rssi,
    snr,
    raw_payload
  });
  
  // Atualizar status do dispositivo
  await Device.updateOne(
    { device_id }, 
    { 
      last_seen: new Date(timestamp), 
      status: 'online' 
    }
  );
  
  res.status(201).json({ 
    success: true,
    message: 'Telemetria armazenada',
    data: {
      id: telemetry._id,
      device_id: telemetry.device_id,
      timestamp: telemetry.timestamp
    }
  });
};

