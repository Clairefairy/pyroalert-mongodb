const { Schema: Sch, model: Mod } = require('mongoose');
const TelemetrySchema = new Sch({
  device_id: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true },
  sensors: { type: Sch.Types.Mixed },
  battery_v: Number,
  gateway: String,
  rssi: Number,
  snr: Number,
  raw_payload: String
}, { timestamps: true });
module.exports = Mod('Telemetry', TelemetrySchema);
