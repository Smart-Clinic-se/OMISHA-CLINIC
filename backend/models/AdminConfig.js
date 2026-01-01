const mongoose = require('mongoose');

const AdminConfigSchema = new mongoose.Schema({
    // Configurable Validity in Days (Default: 7)
    followUpValidityDays: {
        type: Number,
        default: 7,
        min: 1
    },
    // Track History of Validity Changes
    validityChanges: [{
        oldValue: Number,
        newValue: Number,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('AdminConfig', AdminConfigSchema);
