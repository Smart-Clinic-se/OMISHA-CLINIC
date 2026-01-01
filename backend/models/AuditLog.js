const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // Action performed (e.g., "LOGIN", "FINALIZE_PRESCRIPTION", "AMEND_RECORD", "CANCEL_APPOINTMENT")
  action: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  // The entity being modified (e.g., "MedicalRecord", "Queue", "User")
  targetType: {
    type: String,
    required: true,
    enum: ['MedicalRecord', 'Queue', 'User', 'Report', 'AdminConfig']
  },

  // ID of the specific document being modified
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Snapshot of their role at the time (in case they change roles later)
  role: {
    type: String,
    required: true
  },

  // IP Address for security tracking 
  ipAddress: {
    type: String,
    default: 'Unknown'
  },

  // Reason for the action (Critical for Amendments/Corrections) [cite: 141, 170]
  reason: {
    type: String,
    trim: true,
    default: ''
  },

  // Snapshot of changes (optional: store "before" and "after" state)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }

}, {
  timestamps: { createdAt: true, updatedAt: false } // We only need to know WHEN it happened
});

// Index for Admin Dashboard analytics
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);