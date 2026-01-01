const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

// @route   GET /api/medicines/search?q=query
// @desc    Search medicines by name (partial match)
// @access  Private (Doctors/Staff)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ message: "Search query must be at least 2 chars" });
        }

        // Regex for partial match, case-insensitive
        // We anchor to the start for better performance if possible, but user asked for "partial matching" (e.g. "Para" inside "Paracetamol").
        // "Para" in "Paracetamol" is a prefix match mostly.
        // But "mol" in "Paracetamol" would be a suffix match.
        // Let's do flexible regex: new RegExp(q, 'i') -> contains q

        const regex = new RegExp(q, 'i');

        const medicines = await Medicine.find({ name: regex })
            .select('name type strength dosage_form')
            .limit(20);

        res.json(medicines);

    } catch (error) {
        console.error("Medicine Search Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
