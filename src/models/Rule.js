const { Schema: Sr, model: Mr } = require('mongoose');
const RuleSchema = new Sr({
  rule_id: { type: String, required: true, unique: true },
  name: String,
  condition: String,
  actions: [String],
  enabled: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = Mr('Rule', RuleSchema);
