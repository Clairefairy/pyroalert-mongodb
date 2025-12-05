const adafruitService = require('../services/adafruitService');

/**
 * GET /api/v1/adafruit/status
 * Retorna status dos feeds do Adafruit IO
 */
exports.status = async (req, res) => {
  const status = await adafruitService.getFeedsStatus();
  
  res.json({
    success: true,
    message: 'Status dos feeds Adafruit IO',
    data: status
  });
};

/**
 * POST /api/v1/adafruit/sync/:deviceId
 * Sincroniza leituras do Adafruit IO para um dispositivo (por ObjectId)
 */
exports.sync = async (req, res) => {
  const { deviceId } = req.params;
  
  try {
    const result = await adafruitService.syncReadings(deviceId);
    
    res.status(201).json({
      success: true,
      message: 'Leituras sincronizadas com sucesso',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/v1/adafruit/sync/device/:device_id
 * Sincroniza leituras do Adafruit IO para um dispositivo (por device_id string)
 */
exports.syncByDeviceId = async (req, res) => {
  const { device_id } = req.params;
  
  try {
    const result = await adafruitService.syncReadingsByDeviceId(device_id);
    
    res.status(201).json({
      success: true,
      message: 'Leituras sincronizadas com sucesso',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/v1/adafruit/feeds
 * Lista configuração dos feeds
 */
exports.feeds = async (req, res) => {
  res.json({
    success: true,
    data: {
      baseUrl: adafruitService.ADAFRUIT_CONFIG.baseUrl,
      feeds: adafruitService.ADAFRUIT_CONFIG.feeds
    }
  });
};



