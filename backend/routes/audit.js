const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// === GET: Fetch Audit Logs with Filters ===
router.get('/', async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            action,
            staffId,
            role,
            search,
            page = 1,
            limit = 50
        } = req.query;

        const query = {};

        // 1. Date Range Filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                // Start of Day
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }
            if (endDate) {
                // End of Day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // 2. Exact Filters
        if (action) query.action = action;
        if (staffId) query.performedBy = staffId;
        if (role) query.role = role;

        // 3. Search (Reason or Action)
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { reason: regex },
                { action: regex }
            ];
        }

        const skip = (page - 1) * limit;

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('performedBy', 'name username role'); // Get staff details

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error("Audit Log Error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
    }
});

module.exports = router;
