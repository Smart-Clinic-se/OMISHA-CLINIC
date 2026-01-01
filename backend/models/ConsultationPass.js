const mongoose = require('mongoose');

const ConsultationPassSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // IST Timestamps (Managed via Code)
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    // Optional: Readable IST Timestamp
    createdAtIST: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Cancelled'],
        default: 'Active',
        index: true
    },
    origin: {
        type: String,
        enum: ['InitialConsult', 'Override', 'ManualAdjustment'],
        default: 'InitialConsult'
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    validityDays: {
        type: Number,
        required: true,
        default: 7
    },
    // If cancelled
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelReason: String

}, {
    timestamps: true
});

// Auto-populate IST String
ConsultationPassSchema.pre('save', function (next) {
    if (!this.createdAtIST) {
        this.createdAtIST = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true
        });
    }
    next();
});

// IMPORTANT: Unique Compound Index to enforce Single Active Pass
ConsultationPassSchema.index({ patientId: 1, doctorId: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'Active' }
});

module.exports = mongoose.model('ConsultationPass', ConsultationPassSchema);
