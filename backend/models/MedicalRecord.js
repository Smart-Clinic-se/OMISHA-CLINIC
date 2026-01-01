const mongoose = require('mongoose');

// Sub-schema for Medicines [cite: 96-102]
const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // Tablet Name
  strength: { type: String, trim: true }, // e.g. 500mg
  type: { type: String, trim: true }, // e.g. Tablet, Syrup [NEW]
  dosageStyle: { type: String, required: true, trim: true }, // e.g. 1-0-1
  duration: { type: String, required: true, trim: true }, // e.g. 5 days
  instruction: {
    type: String,
    enum: ['Before Food', 'After Food', 'With Food', 'Empty Stomach', 'Other'],
    default: 'After Food'
  },
  notes: { type: String, trim: true } // e.g. Avoid driving
}, { _id: false });

// Sub-schema for Audit Trail of Corrections 
const AmendmentSchema = new mongoose.Schema({
  amendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true }, // Why was it changed?
  timestamp: { type: Date, default: Date.now },
  changes: { type: mongoose.Schema.Types.Mixed } // Snapshot of the change
}, { _id: false });

const MedicalRecordSchema = new mongoose.Schema({
  // Link to Queue/Appointment
  queueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true, index: true },
  tokenNumber: { type: String, required: true },

  // Patient & Doctor References
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Denormalized Names (Snapshots)
  patientName: { type: String, required: true },
  doctorName: { type: String, required: true },

  // Clinical Data [cite: 93-105]
  visitDate: { type: Date, default: Date.now, index: true },
  symptoms: { type: String, required: true, trim: true }, // Chief Complaint
  diagnosis: { type: String, required: true, trim: true },

  medicines: [MedicineSchema],

  testsRequested: [{ type: String, trim: true }], // Lab tests
  advice: { type: String, trim: true },
  followUpDate: { type: Date },

  // Simple Billing 
  billingStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },

  // Attachments (Reports uploaded by Staff) [cite: 112]
  attachments: [{
    reportType: { type: String, required: true }, // e.g. X-Ray, Blood Test
    fileUrl: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: false } // [NEW] Staff Toggle
  }],

  // Access Control [NEW]
  isPrivate: { type: Boolean, default: false }, // Doctor Toggle

  // Locking Mechanism [cite: 66]
  isFinalized: { type: Boolean, default: false },
  finalizedAt: { type: Date },

  // Audit Trail for Corrections
  amendments: [AmendmentSchema]

}, { timestamps: true });

// Middleware: Prevent direct edits if finalized (Immutability) [cite: 66, 108]
MedicalRecordSchema.pre('save', function (next) {
  // If record is finalized, ONLY allow:
  // 1. Adding to 'amendments' array
  // 2. Updating 'billingStatus' (Staff action)
  // 3. Adding 'attachments' (Staff action)
  if (!this.isNew && this.isFinalized) {
    const isAmendment = this.isModified('amendments');
    const isBilling = this.isModified('billingStatus');
    const isAttachment = this.isModified('attachments');

    // If any other field is modified, throw error
    if (!isAmendment && !isBilling && !isAttachment) {
      const err = new Error('This record is finalized and immutable. Create an amendment to correct it.');
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);