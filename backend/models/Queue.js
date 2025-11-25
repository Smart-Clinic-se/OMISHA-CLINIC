const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
    // The visible Token (e.g., "RAJ-001")
    tokenNumber: { 
        type: String, 
        required: true, 
        trim: true
    },

    // Link to Registered Patient 
    // Note: Staff now registers walk-ins[cite: 79], so this should generally be populated.
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Snapshot of Patient Details (Fast lookup for TV/Dashboards)
    patientName: { type: String, required: true },
    patientMobile: { type: String },
    age: { type: Number },
    gender: { type: String },

    // Assigned Doctor
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        index: true
    },

    // Visit Details
    visitType: {
        type: String,
        enum: ['New', 'Follow-up'],
        default: 'New'
    },

    chiefComplaint: {
        type: String,
        trim: true
    },

    // Status Flow [cite: 88]
    status: { 
        type: String, 
        enum: ['Waiting', 'In-Cabin', 'Completed', 'Cancelled', 'Skipped', 'No-Show'], 
        default: 'Waiting',
        index: true
    },

    // Timestamps for Analytics & History Snapshot [cite: 54, 120-123]
    checkInTime: { type: Date, default: Date.now }, // Registration time
    calledTime: { type: Date }, // When status moved to In-Cabin
    completedTime: { type: Date }, // When status moved to Completed

    // Simple Billing 
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    // Optional amount field for record-keeping [cite: 59]
    amount: {
        type: Number,
        default: 0
    },

    // Booking Source
    bookingSource: {
        type: String,
        enum: ['Online', 'Walk-in'],
        required: true
    },

    // Date of the Appointment (Used for filtering today's queue)
    appointmentDate: {
        type: Date,
        required: true,
        index: true
    },
    
    notes: { type: String }

}, { 
    timestamps: true 
});

// Compound Index: Ensure unique token numbers for a doctor on a specific date
QueueSchema.index({ assignedTo: 1, appointmentDate: 1, tokenNumber: 1 }, { unique: true });

module.exports = mongoose.model('Queue', QueueSchema);