const { Schema, model } = require('mongoose');

/**
 * Reading schema - Leituras dos sensores do dispositivo
 * 
 * Campos de sensores:
 * - smoke: nível de fumaça
 * - sense: sensação térmica
 * - temp: temperatura
 * - humid: umidade do ar
 * - moist: umidade do solo
 * 
 * Cada campo contém:
 * - value: valor da leitura (last_value da API)
 * - readAt: data/hora da leitura (updated_at da API, corrigido -3h)
 */

const SensorReadingSchema = new Schema({
  value: { type: Number, required: true },
  readAt: { type: Date, required: true }
}, { _id: false });

const ReadingSchema = new Schema({
  device: { 
    type: Schema.Types.ObjectId, 
    ref: 'Device', 
    required: true,
    index: true
  },
  
  // Sensores
  smoke: SensorReadingSchema,  // Fumaça
  sense: SensorReadingSchema,  // Sensação térmica
  temp: SensorReadingSchema,   // Temperatura
  humid: SensorReadingSchema,  // Umidade do ar
  moist: SensorReadingSchema,  // Umidade do solo
  
  // Metadados
  raw: { type: Schema.Types.Mixed } // Dados brutos da API (opcional)
}, { timestamps: true });

// Índice composto para buscar leituras de um dispositivo por data
ReadingSchema.index({ device: 1, createdAt: -1 });

/**
 * Corrige o fuso horário da API (adiantada 3 horas)
 * @param {string|Date} apiDate - Data da API no formato ISO
 * @returns {Date} Data corrigida
 */
ReadingSchema.statics.correctTimezone = function(apiDate) {
  const date = new Date(apiDate);
  // Subtrai 3 horas (API está adiantada)
  date.setHours(date.getHours() - 3);
  return date;
};

/**
 * Cria uma leitura a partir dos dados da API do dispositivo
 * @param {string} deviceId - ObjectId do dispositivo
 * @param {object} apiData - Dados da API com campos last_value e updated_at
 */
ReadingSchema.statics.createFromApiData = async function(deviceId, apiData) {
  const correctTimezone = this.correctTimezone;
  
  const reading = new this({
    device: deviceId,
    smoke: apiData.smoke ? {
      value: apiData.smoke.last_value,
      readAt: correctTimezone(apiData.smoke.updated_at)
    } : undefined,
    sense: apiData.sense ? {
      value: apiData.sense.last_value,
      readAt: correctTimezone(apiData.sense.updated_at)
    } : undefined,
    temp: apiData.temp ? {
      value: apiData.temp.last_value,
      readAt: correctTimezone(apiData.temp.updated_at)
    } : undefined,
    humid: apiData.humid ? {
      value: apiData.humid.last_value,
      readAt: correctTimezone(apiData.humid.updated_at)
    } : undefined,
    moist: apiData.moist ? {
      value: apiData.moist.last_value,
      readAt: correctTimezone(apiData.moist.updated_at)
    } : undefined,
    raw: apiData.raw || undefined
  });
  
  return reading.save();
};

module.exports = model('Reading', ReadingSchema);



