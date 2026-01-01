const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['Cash', 'UPI', 'Card', 'Other'],
        required: true
    },
    reasonType: {
        type: String,
        enum: ['ConsultationFee', 'Medicine', 'LabTest', 'Override'],
        required: true
    },
    // Mandatory if reasonType is 'Override'
    reasonNote: {
        type: String,
        trim: true
    },
    // Operational comments by staff
    staffNote: {
        type: String,
        trim: true
    },
    paymentReference: {
        type: String,
        trim: true
    },
    // Auto-true for Cash, False for others (Manual Verification needed)
    paymentVerified: {
        type: Boolean,
        default: false
    },
    shiftId: {
        type: String
    },

    // Links
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    queueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Queue'
    },
    consultationPassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConsultationPass'
    }
}, {
    timestamps: true
});

// Middleware to auto-verify cash payments
PaymentSchema.pre('save', function (next) {
    if (this.method === 'Cash' && this.isNew) {
        this.paymentVerified = true;
    }
    next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
