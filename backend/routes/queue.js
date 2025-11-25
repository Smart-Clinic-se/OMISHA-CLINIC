const router = require('express').Router();
const Queue = require('../models/Queue');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// === Generate Token ===
const generateTokenNumber = async (doctorId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Queue.countDocuments({
    assignedTo: doctorId,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay }
  });

  const doctor = await User.findById(doctorId).select('name');
  if (!doctor) throw new Error('Doctor not found');

  let namePart = doctor.name.trim().replace(/^Dr\.?\s+/i, ''); 
  let prefix = namePart.split(' ')[0].toUpperCase().slice(0, 3);
  if (prefix.length < 3) prefix = prefix.padEnd(3, 'X');

  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

// === GET: Active Queue ===
router.get('/', async (req, res) => {
  try {
    const { doctorId, date, allStatus } = req.query;
    const query = {}; 
    if (doctorId) query.assignedTo = doctorId;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: start, $lte: end };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.appointmentDate = { $gte: today };
    }
    
    if (!allStatus) {
        query.status = { $in: ['Waiting', 'In-Cabin'] };
    }

    const queue = await Queue.find(query)
      .sort({ createdAt: 1 })
      .populate('assignedTo', 'name specialization availabilityStatus')
      .populate('patientId', 'name mobile age gender bloodGroup systemId');

    res.json({ success: true, data: queue });
  } catch (err) {
    console.error("Queue GET Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch queue" });
  }
});

// === POST: Add to Queue (Booking) ===
router.post('/add', async (req, res) => {
  try {
    let {
      patientId,
      firstName, 
      lastName,  
      patientName, 
      patientMobile, 
      age,           
      gender,
      bloodGroup, 
      assignedTo,
      chiefComplaint,
      bookingSource = 'Online',
      visitType = 'New'
    } = req.body;

    // Construct patientName if missing
    if (!patientName && firstName && lastName) {
        patientName = `${firstName.trim()} ${lastName.trim()}`;
    }

    // FIX: Use 'newUserCredentials' variable correctly
    let newUserCredentials = null; 
    let autoPassword = "123456"; 

    // === AUTO-REGISTER WALK-IN PATIENT ===
    if (!patientId && bookingSource === 'Walk-in') {
        
        if (!patientName || !assignedTo) {
             return res.status(400).json({ success: false, message: "Patient Name and Doctor are required." });
        }

        // 1. Try to find existing patient by Mobile
        let user = null;
        if (patientMobile) {
            user = await User.findOne({ mobile: patientMobile });
        }

        // 2. If not found, CREATE new patient
        if (!user) {
            if (!firstName || !lastName) {
                 const parts = patientName.split(' ');
                 firstName = parts[0];
                 lastName = parts.slice(1).join(' ') || 'Patient';
            }

            const uniqueSuffix = Date.now().toString().slice(-4);
            const finalMobile = patientMobile || `99${Date.now().toString().slice(-8)}`;
            
            let baseUsername = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
            let finalUsername = baseUsername;
            
            if (await User.findOne({ username: finalUsername })) {
                finalUsername = `${baseUsername}${uniqueSuffix}`;
            }

            user = new User({
                name: patientName,
                mobile: finalMobile,
                username: finalUsername, 
                password: autoPassword, 
                role: 'patient',
                age: age || 0,
                gender: gender || 'Other',
                bloodGroup: bloodGroup || 'Unknown', 
                systemId: `WALK-${uniqueSuffix}`
            });
            await user.save();
            
            // FIX: Assign to the correct variable
            newUserCredentials = {
                username: finalUsername, 
                mobile: finalMobile,
                password: autoPassword
            };
        }

        patientId = user._id;
        if (!patientMobile) patientMobile = user.mobile;
    }

    if (!patientId || !assignedTo) {
      return res.status(400).json({ success: false, message: "Patient ID and Doctor are required" });
    }

    const doctor = await User.findById(assignedTo);
    if (!doctor) {
       return res.status(400).json({ success: false, message: "Doctor not found." });
    }

    const today = new Date();
    const tokenNumber = await generateTokenNumber(assignedTo, today);

    const newEntry = new Queue({
      tokenNumber,
      patientId,
      patientName,
      patientMobile, 
      age,
      gender,
      assignedTo,
      chiefComplaint,
      bookingSource,
      visitType,
      appointmentDate: today,
      status: 'Waiting',
      paymentStatus: 'Unpaid',
      checkInTime: new Date()
    });

    const saved = await newEntry.save();
    
    const populated = await saved.populate([
      { path: 'assignedTo', select: 'name specialization' },
      { path: 'patientId', select: 'name mobile age gender bloodGroup systemId' }
    ]);

    if (req.io) {
        req.io.emit('queue_update', {
            type: 'ADD',
            data: populated,
            doctorId: assignedTo
        });
    }

    await AuditLog.create({
        action: 'QUEUE_ADD',
        targetType: 'Queue',
        targetId: saved._id,
        performedBy: patientId, 
        role: bookingSource === 'Online' ? 'patient' : 'staff',
        reason: `New ${visitType} Appointment (${bookingSource})`
    });

    res.status(201).json({ 
        success: true, 
        data: populated, 
        tokenNumber,
        newUserCredentials // This is now correctly defined
    });

  } catch (err) {
    console.error("Add Queue Error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// === PUT: Update Status / Payment ===
router.put('/update/:id', async (req, res) => {
  try {
    const { status, paymentStatus, notes } = req.body;
    const updates = {};
    
    if (status) {
        updates.status = status;
        if (status === 'In-Cabin') updates.calledTime = new Date();
        if (status === 'Completed') updates.completedTime = new Date();
    }

    if (paymentStatus) {
        updates.paymentStatus = paymentStatus;
    }
    
    if (notes) updates.notes = notes;

    const updated = await Queue.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignedTo', 'name')
      .populate('patientId', 'name mobile');

    if (!updated) return res.status(404).json({ success: false, message: "Token not found" });

    const emitPayload = {
      type: 'UPDATE',
      data: updated,
      doctorId: updated.assignedTo._id
    };
    
    if (status === 'In-Cabin') emitPayload.calledToken = updated.tokenNumber;
    
    if (req.io) req.io.emit('queue_update', emitPayload);

    await AuditLog.create({
        action: 'QUEUE_UPDATE',
        targetType: 'Queue',
        targetId: updated._id,
        performedBy: updated.assignedTo._id, 
        role: 'staff', 
        reason: `Status: ${status}, Payment: ${paymentStatus}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Queue Update Error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// === DELETE: Cancel Token ===
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await Queue.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Token not found" });

    if (req.io) {
        req.io.emit('queue_update', {
            type: 'DELETE',
            data: deleted,
            doctorId: deleted.assignedTo
        });
    }

    await AuditLog.create({
        action: 'QUEUE_REMOVE',
        targetType: 'Queue',
        targetId: req.params.id,
        performedBy: deleted.assignedTo, 
        role: 'staff',
        reason: 'Token Deleted'
    });

    res.json({ success: true, message: "Token removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

module.exports = router;