const router = require('express').Router();
const AdminConfig = require('../models/AdminConfig');
const AuditLog = require('../models/AuditLog');

// === GET: Fetch System Config ===
router.get('/config', async (req, res) => {
    try {
        let config = await AdminConfig.findOne();
        if (!config) {
            // Create default if not exists
            config = new AdminConfig({ followUpValidityDays: 7 });
            await config.save();
        }
        res.json({ success: true, data: config });
    } catch (err) {
        console.error("Fetch Config Error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch configuration" });
    }
});

// === PUT: Update Validity Days ===
router.put('/config/validity', async (req, res) => {
    try {
        const { validityDays, performedBy } = req.body;

        if (!validityDays || validityDays < 1) {
            return res.status(400).json({ success: false, message: "Validity days must be a positive number." });
        }

        let config = await AdminConfig.findOne();
        if (!config) {
            config = new AdminConfig({ followUpValidityDays: 7 });
        }

        const oldDays = config.followUpValidityDays;

        if (oldDays === parseInt(validityDays)) {
            return res.status(400).json({ success: false, message: "New value is same as old value." });
        }

        config.followUpValidityDays = parseInt(validityDays);
        config.validityChanges.push({
            oldValue: oldDays,
            newValue: validityDays,
            changedBy: performedBy,
            date: new Date()
        });

        await config.save();

        await AuditLog.create({
            action: 'CONFIG_UPDATE',
            targetType: 'AdminConfig',
            targetId: config._id,
            performedBy: performedBy,
            role: 'admin',
            reason: `Medical Pass Validity changed from ${oldDays} days to ${validityDays} days`
        });

        res.json({ success: true, message: "Configuration updated successfully", data: config });

    } catch (err) {
        console.error("Update Config Error:", err);
        res.status(500).json({ success: false, message: "Failed to update configuration" });
    }
});

module.exports = router;
