const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Username = First_Last (used for Login)
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  // Display Name
  name: {
    type: String,
    required: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
  },

  role: {
    type: String,
    enum: ['patient', 'doctor', 'staff', 'admin'],
    required: true,
  },

  // Contact info
  mobile: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },

  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    trim: true
  },

  // Internal System ID
  systemId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Security Fields
  securityQuestion: {
    type: String,
    trim: true,
  },
  securityAnswer: {
    type: String,
    trim: true, // Will be hashed
  },

  // === DOCTOR SPECIFIC FIELDS ===
  specialization: {
    type: String,
    trim: true,
    default: '',
  },

  // Real-time Availability State
  availabilityStatus: {
    type: String,
    enum: ['Available', 'On Break', 'Shift Ended', 'Not Available'],
    default: 'Not Available'
  },

  breakUntil: {
    type: Date,
    default: null,
  },

  // Weekly Schedule
  weeklySchedule: {
    type: Map,
    of: new mongoose.Schema({
      start: String, // HH:mm
      end: String,
      off: { type: Boolean, default: false },
      breakStart: String,
      breakEnd: String
    }, { _id: false }),
    default: {}
  },

  // Exceptions
  exceptions: [{
    date: Date,
    type: { type: String, enum: ['Leave', 'Emergency', 'Half-Day'] },
    note: String
  }]

}, {
  timestamps: true
});

// Index only for role since username and mobile already have unique: true
UserSchema.index({ role: 1 });

// Hash Password AND Security Answer
UserSchema.pre('save', async function (next) {
  // Hash Password
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Hash Security Answer (Normalized to lowercase before hashing to avoid case issues)
  if (this.isModified('securityAnswer')) {
    if (this.securityAnswer) {
      const normalizedAnswer = this.securityAnswer.trim().toLowerCase();
      this.securityAnswer = await bcrypt.hash(normalizedAnswer, 12);
    }
  }

  next();
});

module.exports = mongoose.model('User', UserSchema);