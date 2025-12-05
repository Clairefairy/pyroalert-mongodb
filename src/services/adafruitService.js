const axios = require('axios');
const Reading = require('../models/Reading');
const Device = require('../models/Device');

/**
 * Serviço de integração com Adafruit IO
 * Busca dados dos feeds e salva como leituras no banco
 */

// Configuração dos feeds do Adafruit IO
const ADAFRUIT_CONFIG = {
  baseUrl: 'https://io.adafruit.com/api/v2/pyroalert/feeds',
  feeds: {
    smoke: 'pyroalert.fumo',       // Fumaça
    moist: 'pyroalert.umisolo',    // Umidade do Solo
    temp: 'pyroalert.umi22',       // Temperatura do Ar
    humid: 'pyroalert.temp22',     // Umidade do Ar
    sense: 'pyroalert.sense22'     // Sensação Térmica
  }
};

/**
 * Busca dados de um feed específico do Adafruit IO
 * @param {string} feedKey - Chave do feed (ex: 'pyroalert.fumo')
 * @returns {Promise<object>} Dados do feed
 */
const fetchFeed = async (feedKey) => {
  try {
    const url = `${ADAFRUIT_CONFIG.baseUrl}/${feedKey}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar feed ${feedKey}:`, error.message);
    return null;
  }
};

/**
 * Busca todos os feeds configurados
 * @returns {Promise<object>} Objeto com dados de todos os feeds
 */
const fetchAllFeeds = async () => {
  const results = {};
  
  const promises = Object.entries(ADAFRUIT_CONFIG.feeds).map(async ([sensor, feedKey]) => {
    const data = await fetchFeed(feedKey);
    if (data) {
      results[sensor] = {
        last_value: parseFloat(data.last_value),
        updated_at: data.updated_at,
        feed_name: data.name,
        feed_key: data.key
      };
    }
  });
  
  await Promise.all(promises);
  return results;
};

/**
 * Sincroniza leituras do Adafruit IO para um dispositivo
 * @param {string} deviceId - ObjectId do dispositivo
 * @returns {Promise<object>} Resultado da sincronização
 */
const syncReadings = async (deviceId) => {
  // Verificar se o dispositivo existe
  const device = await Device.findById(deviceId).exec();
  if (!device) {
    throw new Error('Dispositivo não encontrado');
  }
  
  // Buscar dados de todos os feeds
  console.log(`[Adafruit] Sincronizando leituras para dispositivo ${device.device_id}...`);
  const feedsData = await fetchAllFeeds();
  
  if (Object.keys(feedsData).length === 0) {
    throw new Error('Não foi possível obter dados dos feeds');
  }
  
  // Criar leitura usando o método que corrige o fuso horário
  const reading = await Reading.createFromApiData(deviceId, feedsData);
  
  // Atualizar status do dispositivo
  device.last_seen = new Date();
  device.status = 'online';
  await device.save();
  
  console.log(`[Adafruit] Leitura salva com sucesso: ${reading._id}`);
  
  return {
    reading,
    feedsData,
    device: {
      id: device._id,
      device_id: device.device_id
    }
  };
};

/**
 * Sincroniza leituras usando device_id (string)
 * @param {string} deviceIdString - ID do dispositivo (ex: 'PYRO-TEST-001')
 * @returns {Promise<object>} Resultado da sincronização
 */
const syncReadingsByDeviceId = async (deviceIdString) => {
  const device = await Device.findOne({ device_id: deviceIdString }).exec();
  if (!device) {
    throw new Error(`Dispositivo ${deviceIdString} não encontrado`);
  }
  return syncReadings(device._id);
};

/**
 * Retorna status dos feeds (para debug/monitoramento)
 * @returns {Promise<object>} Status de todos os feeds
 */
const getFeedsStatus = async () => {
  const feedsData = await fetchAllFeeds();
  
  return {
    timestamp: new Date().toISOString(),
    feeds: Object.entries(feedsData).map(([sensor, data]) => ({
      sensor,
      feed_key: data.feed_key,
      last_value: data.last_value,
      updated_at: data.updated_at,
      corrected_time: Reading.correctTimezone(data.updated_at)
    }))
  };
};

module.exports = {
  ADAFRUIT_CONFIG,
  fetchFeed,
  fetchAllFeeds,
  syncReadings,
  syncReadingsByDeviceId,
  getFeedsStatus
};

