const { Schema: S2, model: M2 } = require('mongoose');
const AlertSchema = new S2({
  alert_id: { type: String, required: true, unique: true },
  device_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  type: String,
  status: { type: String, enum: ['open','acknowledged','closed'], default: 'open' },
  payload: { type: S2.Types.Mixed }
}, { timestamps: true });
module.exports = M2('Alert', AlertSchema);
