const router = require('express').Router();
const MedicalRecord = require('../models/MedicalRecord');
const Queue = require('../models/Queue');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// === POST: Add New Prescription (Finalize Visit) ===
router.post('/add', async (req, res) => {
  try {
    const {
      queueId,
      tokenNumber,
      patientId,
      doctorId,
      patientName,
      patientMobile,
      symptoms,
      diagnosis,
      medicines,
      testsRequested,
      advice,
      notes,
      followUpDate,
      isFinalized
    } = req.body;

    if (!queueId || !patientId || !doctorId || !diagnosis) {
      return res.status(400).json({ success: false, message: "Missing critical fields" });
    }

    const doctor = await User.findById(doctorId).select('name');
    const doctorName = doctor ? doctor.name : "Unknown";

    const newRecord = new MedicalRecord({
      queueId,
      tokenNumber,
      patientId,
      doctorId,
      patientName,
      doctorName,
      symptoms,
      diagnosis,
      medicines: medicines || [],
      testsRequested: testsRequested || [],
      advice,
      notes,
      followUpDate,
      isFinalized: !!isFinalized,
      finalizedAt: isFinalized ? new Date() : null
    });

    const savedRecord = await newRecord.save();

    if (isFinalized) {
      await Queue.findByIdAndUpdate(queueId, {
        status: 'Completed',
        completedTime: new Date()
      });

      if (req.io) {
        req.io.emit('queue_update', {
          type: 'UPDATE',
          data: { _id: queueId, status: 'Completed' },
          doctorId
        });
      }
    }

    await AuditLog.create({
      action: isFinalized ? 'PRESCRIPTION_FINALIZE' : 'PRESCRIPTION_DRAFT',
      targetType: 'MedicalRecord',
      targetId: savedRecord._id,
      performedBy: doctorId,
      role: 'doctor',
      reason: 'Consultation Ended'
    });

    res.status(201).json({ success: true, data: savedRecord });

  } catch (err) {
    console.error("Add Record Error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// === PUT: Amend Record ===
router.put('/amend/:id', async (req, res) => {
  try {
    const { reason, changes, userId } = req.body;

    if (!reason || !changes) {
      return res.status(400).json({ success: false, message: "Reason and changes are required." });
    }

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    record.amendments.push({
      amendedBy: userId,
      reason,
      changes,
      timestamp: new Date()
    });

    await record.save();

    await AuditLog.create({
      action: 'AMEND_RECORD',
      targetType: 'MedicalRecord',
      targetId: record._id,
      performedBy: userId,
      role: 'doctor',
      reason: reason
    });

    res.json({ success: true, message: "Amendment recorded.", data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to amend record." });
  }
});

// === POST: Upload Report ===
router.post('/upload/:id', upload.single('reportFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { reportType, uploadedBy } = req.body;
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) return res.status(404).json({ message: "Medical Record not found" });

    // Save the CLOUDINARY URL, not a local path
    record.attachments.push({
      reportType,
      fileUrl: req.file.path,
      uploadedBy,
      uploadedAt: new Date()
    });

    await record.save();

    await AuditLog.create({
      action: 'REPORT_UPLOAD',
      targetType: 'MedicalRecord',
      targetId: record._id,
      performedBy: uploadedBy,
      role: 'staff',
      reason: `Uploaded ${reportType}`
    });

    res.json({ success: true, message: "Report uploaded", data: record });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// === GET: Patient History (Search by Name or Mobile) ===
router.get('/history', async (req, res) => {
  try {
    // UPDATED LOGIC: Accept 'name' parameter
    const { patientId, mobile, name } = req.query;

    const query = {};

    if (patientId) {
      query.patientId = patientId;
    } else if (mobile) {
      query.patientMobile = mobile;
    } else if (name) {
      // 1. Find User ID by Name (Case Insensitive Regex)
      // Warning: If multiple users have same name, this picks matching ones
      const users = await User.find({
        name: { $regex: new RegExp(name, 'i') },
        role: 'patient'
      }).select('_id');

      if (users.length === 0) {
        // If no user found, try searching the denormalized 'patientName' in records directly
        query.patientName = { $regex: new RegExp(name, 'i') };
      } else {
        // Search records belonging to ANY of the found user IDs
        const userIds = users.map(u => u._id);
        query.patientId = { $in: userIds };
      }
    } else {
      return res.status(400).json({ message: "Name, Mobile, or Patient ID required" });
    }

    const history = await MedicalRecord.find(query)
      .sort({ visitDate: -1 })
      .limit(10) // Increased limit to see more if duplicates exist
      .populate('doctorId', 'name specialization')
      .populate('attachments.uploadedBy', 'name');

    res.json({ success: true, count: history.length, data: history });

  } catch (err) {
    console.error("History Error:", err);
    res.status(500).json({ success: false, message: "Fetch history failed" });
  }
});

// === GET: Single Record ===
router.get('/record/:id', async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name mobile age gender')
      .populate('amendments.amendedBy', 'name role');

    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: "Invalid ID" });
  }
});

module.exports = router;