const { Schema: S, model: M } = require('mongoose');
const DeviceSchema = new S({
  device_id: { type: String, required: true, unique: true },
  dev_eui: { type: String },
  model: { type: String },
  location: { lat: Number, lng: Number, alt: Number },
  status: { type: String, enum: ['online','offline','maintenance'], default: 'offline' },
  last_seen: { type: Date },
  metadata: { type: S.Types.Mixed }
}, { timestamps: true });
module.exports = M('Device', DeviceSchema);
