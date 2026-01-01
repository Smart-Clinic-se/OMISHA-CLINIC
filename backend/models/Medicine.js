const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true // Basic Index
    },
    type: {
        type: String, // e.g. Tablet, Injection, Syrup
        trim: true
    },
    strength: {
        type: String, // e.g. 500 mg
        trim: true
    },
    dosage_form: {
        type: String, // e.g. 10's, 10ml
        trim: true
    },
    category: {
        type: String, // e.g. General
        trim: true
    },
    price: {
        type: Number
    }
}, { timestamps: true });

// Text Index for Search (Partial matching logic will be handled via Regex in the query, 
// but a text index is good for performance if we switch to full-text search later.
// For now, simple indexing on 'name' is most important for regex performance anchored at start, 
// but user asked for "partial matching" (e.g. "Para" inside "Paracetamol"). 
// MongoDB text search is whole-word based usually. Regex is better for substring.
// We keep standard index on name.
MedicineSchema.index({ name: 'text' });

module.exports = mongoose.model('Medicine', MedicineSchema);
