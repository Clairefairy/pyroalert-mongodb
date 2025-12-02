
 // -------------------------- src/models/User.js --------------------------
const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User schema
 * - email: email address for login (unique)
 * - passwordHash: hashed password
 * - name: full name
 * - id_number: CPF or CNPJ (only one should be provided)
 * - id_type: either 'CPF' or 'CNPJ' (determined automatically)
 * - phone: contact phone number (normalized)
 * - role: RBAC role
 */

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v) => emailRegex.test(v),
      message: 'Email inválido'
    }
  },
  passwordHash: { type: String, required: true },
  name: { type: String, required: false },
  id_number: { type: String, required: false, unique: true, sparse: true },
  id_type: { type: String, enum: ['CPF','CNPJ'], required: false },
  phone: { type: String, required: false },
  role: { type: String, enum: ['admin','operator','viewer'], default: 'viewer' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Simple CPF validator (digits only, 11 digits) and CNPJ validator (14 digits)
const onlyDigits = (s) => (s || '').replace(/\D/g, '');
const isCPF = (v) => { const d = onlyDigits(v); return d.length === 11; };
const isCNPJ = (v) => { const d = onlyDigits(v); return d.length === 14; };

// Pre-validate: determine id_type and normalize phone/id_number
UserSchema.pre('validate', function(next) {
  if (this.id_number) {
    const digits = onlyDigits(this.id_number);
    if (isCPF(digits)) {
      this.id_type = 'CPF';
      this.id_number = digits;
    } else if (isCNPJ(digits)) {
      this.id_type = 'CNPJ';
      this.id_number = digits;
    } else {
      // invalid id number length
      const err = new Error('id_number must be a valid CPF (11 digits) or CNPJ (14 digits)');
      return next(err);
    }
  }

  // Normalize phone: keep only digits
  if (this.phone) {
    const p = String(this.phone).trim();
    // remove all non digits
    const digits = p.replace(/\D/g, '');
    this.phone = digits;
  }

  next();
});

// Ensure user cannot have both CPF and CNPJ: since we store single id_number + id_type this is enforced by design.

UserSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Static helper to create user with password hashing
UserSchema.statics.createWithPassword = async function({ email, password, name, id_number, phone, role }) {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
  const hash = await bcrypt.hash(password, saltRounds);
  const u = new this({ email, passwordHash: hash, name, id_number, phone, role });
  return u.save();
};

module.exports = model('User', UserSchema);
