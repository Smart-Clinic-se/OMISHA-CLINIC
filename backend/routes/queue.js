const router = require('express').Router();
const mongoose = require('mongoose');
const Queue = require('../models/Queue');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ConsultationPass = require('../models/ConsultationPass');
const Payment = require('../models/Payment');
const AdminConfig = require('../models/AdminConfig');
const { protect, protectOptional } = require('../middleware/authMiddleware');

// === Generate Token ===

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
router.get('/', protectOptional, async (req, res) => {
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
      .populate('patientId', 'name mobile age gender bloodGroup systemId dob storedAge lastVitalsDate lastHeight lastWeight') // [FIX] Include vitals history
      .populate('consultationPassId'); // Trace pass

    res.json({ success: true, data: queue });
  } catch (err) {
    console.error("Queue GET Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch queue" });
  }
});

// === GET: Active Pass for Patient ===
router.get('/active-pass', protectOptional, async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ success: false, message: "Patient ID is required" });
    }

    const activePass = await ConsultationPass.findOne({
      patientId: patientId,
      status: 'Active',
      validTo: { $gt: new Date() } // Strictly future expiry
    })
      .populate('doctorId', 'name specialization')
      .sort({ validTo: -1 }); // Get the one with latest expiry if multiple (should be unique though)

    res.json({ success: true, data: activePass });
  } catch (err) {
    console.error("Active Pass GET Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch active pass" });
  }
});

// === POST: Register New Patient & Add to Queue (Staff Triage) ===
router.post('/register', protect, async (req, res) => {
  try {
    // [UPDATED] Accepting full details to match Online Registration
    let {
      firstName, lastName, mobile,
      dob, age, gender, bloodGroup, address,
      occupation, recordVisibility,
      assignedTo, chiefComplaint
    } = req.body;

    if (!firstName || !assignedTo || !mobile) {
      return res.status(400).json({ success: false, message: "Name, Mobile, and Doctor are required." });
    }

    // Combine Name
    const fullName = `${firstName.trim()} ${lastName ? lastName.trim() : ''}`.trim();

    // 1. Create or Find User (Patient)
    let user = await User.findOne({ mobile });
    let calculatedAge = 0;
    if (dob) {
      const birthDate = new Date(dob);
      const difference = Date.now() - birthDate.getTime();
      const ageDate = new Date(difference);
      calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    if (user) {
      // Update existing user with new details if provided
      user.name = fullName; // Update name in case of correction
      if (dob) user.dob = dob;
      if (age && !dob) user.storedAge = age; // Update storedAge if provided and no DOB
      if (gender) user.gender = gender;
      if (bloodGroup) user.bloodGroup = bloodGroup;
      if (address) user.address = address;
      if (occupation) user.occupation = occupation;
      if (recordVisibility) user.recordVisibility = recordVisibility;
      await user.save();
    } else {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const baseUsername = firstName.toLowerCase() + "_" + uniqueSuffix;

      user = new User({
        name: fullName,
        username: baseUsername, // Auto-gen username
        mobile: mobile,
        password: "123", // Default placeholder for Walk-ins
        role: 'patient',
        dob: dob || null,
        storedAge: (!dob && age) ? age : undefined, // Save age if DOB is missing
        gender: gender || 'Other',
        bloodGroup: bloodGroup || 'Unknown',
        address: address || '',
        occupation: occupation || "",
        recordVisibility: recordVisibility || "Public",
        systemId: `WALK-${uniqueSuffix}`
      });
      await user.save();
    }

    // 2. Add to Queue
    const doctor = await User.findById(assignedTo);
    const tokenNumber = await generateTokenNumber(assignedTo, new Date());

    // Check Active Pass
    const activePass = await ConsultationPass.findOne({
      patientId: user._id,
      doctorId: assignedTo,
      status: 'Active',
      validTo: { $gt: new Date() }
    });

    const newEntry = new Queue({
      tokenNumber,
      patientId: user._id,
      patientName: user.name,
      patientMobile: user.mobile,
      age: user.age,
      gender: user.gender,
      assignedTo,
      chiefComplaint: chiefComplaint || "New Registration",
      bookingSource: 'Walk-in',
      visitType: activePass ? 'Follow-up' : 'New',
      appointmentDate: new Date(),
      status: 'Waiting',
      paymentStatus: activePass ? 'Paid' : 'Unpaid',
      amount: activePass ? 0 : (doctor.consultationFee || 500),
      consultationPassId: activePass ? activePass._id : null
    });

    const saved = await newEntry.save();
    const populated = await saved.populate([
      { path: 'assignedTo', select: 'name specialization' },
      { path: 'patientId', select: 'name mobile age gender bloodGroup systemId lastVitalsDate lastHeight lastWeight dob storedAge' }, // include vitals & virtual dependencies
      { path: 'consultationPassId' }
    ]);

    if (req.io) {
      req.io.emit('queue_update', {
        type: 'ADD',
        data: populated,
        doctorId: assignedTo
      });
    }

    res.status(201).json({ success: true, data: populated });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// === POST: Add to Queue (Booking) ===
router.post('/add', protect, async (req, res) => {
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
          password: autoPassword,
          role: 'patient',
          storedAge: age || 0, // Save explicit age
          gender: gender || 'Other',
          bloodGroup: bloodGroup || 'Unknown',
          systemId: `WALK-${uniqueSuffix}`
        });
        await user.save();

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

    // === ZERO TRUST PAYMENT LOGIC ===
    let paymentStatus = 'Unpaid';
    let amount = doctor.consultationFee || 500;
    let consultationPassId = null;

    // Check for Active Pass
    const activePass = await ConsultationPass.findOne({
      patientId,
      doctorId: assignedTo,
      status: 'Active',
      validTo: { $gt: new Date() }
    });

    if (activePass) {
      paymentStatus = 'Paid';
      amount = 0;
      consultationPassId = activePass._id;
      visitType = 'Follow-up'; // Auto-detect follow-up if covered
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
      paymentStatus, // Set by backend only
      amount,        // Set by backend only
      consultationPassId,
      checkInTime: new Date()
    });

    const saved = await newEntry.save();

    const populated = await saved.populate([
      { path: 'assignedTo', select: 'name specialization' },
      { path: 'patientId', select: 'name mobile age gender bloodGroup systemId dob storedAge' },
      { path: 'consultationPassId' }
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
      reason: `New ${visitType} Appointment (${bookingSource}) - ${paymentStatus}`
    });

    res.status(201).json({
      success: true,
      data: populated,
      tokenNumber,
      newUserCredentials
    });

  } catch (err) {
    console.error("Add Queue Error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// === POST: Collect Payment (Transactional) ===
router.post('/collect-payment', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { queueId, method, paymentReference, staffNote, collectedBy } = req.body;

    const queueItem = await Queue.findById(queueId).session(session);
    if (!queueItem) throw new Error("Queue item not found");

    // 1. Double Check Active Pass (Race Guard)
    const existingPass = await ConsultationPass.findOne({
      patientId: queueItem.patientId,
      doctorId: queueItem.assignedTo,
      status: 'Active'
    }).session(session);

    if (existingPass) {
      if (existingPass.validTo > new Date()) {
        throw new Error("Patient already has an active consultation pass.");
      } else {
        // Pass is active but expired physically. Mark it Expired to free up the index.
        existingPass.status = 'Expired';
        await existingPass.save({ session });
      }
    }

    // 2. Load Config for Validity
    const config = await AdminConfig.findOne().session(session);
    const validityDays = config?.followUpValidityDays || 7;

    // 3. Create Payment
    const payment = new Payment({
      amount: queueItem.amount,
      method,
      reasonType: 'ConsultationFee',
      staffNote,
      paymentReference,
      patientId: queueItem.patientId,
      doctorId: queueItem.assignedTo,
      collectedBy, // Passed from frontend (current user)
      queueId: queueItem._id,
      verified: method === 'Cash'
    });
    await payment.save({ session });

    // 4. Create Consultation Pass
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setDate(validTo.getDate() + validityDays);

    const newPass = new ConsultationPass({
      patientId: queueItem.patientId,
      doctorId: queueItem.assignedTo,
      validFrom,
      validTo,
      status: 'Active',
      origin: 'InitialConsult',
      paymentId: payment._id,
      createdBy: collectedBy,
      validityDays
    });
    await newPass.save({ session });

    // 5. Update Queue
    queueItem.paymentStatus = 'Paid';
    queueItem.consultationPassId = newPass._id;
    await queueItem.save({ session });

    // Link pass to payment
    payment.consultationPassId = newPass._id;
    await payment.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emit Update
    const updatedQueue = await Queue.findById(queueId)
      .populate('assignedTo', 'name')
      .populate('patientId', 'name mobile')
      .populate('consultationPassId');

    if (req.io) {
      req.io.emit('queue_update', {
        type: 'UPDATE',
        data: updatedQueue,
        doctorId: updatedQueue.assignedTo._id
      });
    }

    // Return details for receipt
    res.json({
      success: true,
      passId: newPass._id,
      paymentId: payment._id,
      validTo: newPass.validTo
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Payment Collection Failed:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// === POST: Override Payment Status (No Pass Created) ===
router.post('/override-payment', protect, async (req, res) => {
  try {
    const { queueId, reasonNote, performedBy } = req.body;

    if (!reasonNote || reasonNote.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Reason is mandatory for override." });
    }

    const queueItem = await Queue.findById(queueId);
    if (!queueItem) return res.status(404).json({ success: false, message: "Item not found" });

    // Create Payment Log for Override (Zero Amount)
    await Payment.create({
      amount: 0,
      method: 'Other',
      reasonType: 'Override',
      reasonNote,
      patientId: queueItem.patientId,
      doctorId: queueItem.assignedTo,
      collectedBy: performedBy,
      queueId: queueItem._id,
      paymentVerified: true
    });

    queueItem.paymentStatus = 'Paid';
    // Note: We do NOT create a Consultation Pass here
    await queueItem.save();

    const updatedQueue = await Queue.findById(queueId)
      .populate('assignedTo', 'name')
      .populate('patientId', 'name mobile')
      .populate('consultationPassId');

    if (req.io) {
      req.io.emit('queue_update', {
        type: 'UPDATE',
        data: updatedQueue,
        doctorId: updatedQueue.assignedTo._id
      });
    }

    await AuditLog.create({
      action: 'PAYMENT_OVERRIDE',
      targetType: 'Queue',
      targetId: queueId,
      performedBy,
      role: 'staff',
      reason: `Override: ${reasonNote}`
    });

    res.json({ success: true, message: "Payment status overridden." });

  } catch (err) {
    console.error("Override Failed:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// === PUT: Confirm Vitals & Update Patient History ===
router.put('/confirm-vitals/:id', protect, async (req, res) => {
  try {
    const { height, weight } = req.body;
    const queueId = req.params.id;

    const queueItem = await Queue.findById(queueId);
    if (!queueItem) return res.status(404).json({ success: false, message: "Queue item not found" });

    // 1. Update Patient Vitals History
    await User.findByIdAndUpdate(queueItem.patientId, {
      lastHeight: height,
      lastWeight: weight,
      lastVitalsDate: new Date()
    });

    // 2. Update Queue Item
    queueItem.vitalsConfirmed = true;
    await queueItem.save();

    const updated = await Queue.findById(queueId)
      .populate('assignedTo', 'name')
      .populate('patientId', 'name mobile age gender bloodGroup systemId lastVitalsDate lastHeight lastWeight dob storedAge')
      .populate('consultationPassId');

    // 3. Emit Real-time Update
    if (req.io) {
      req.io.emit('queue_update', {
        type: 'UPDATE',
        data: updated,
        doctorId: updated.assignedTo._id
      });
    }

    await AuditLog.create({
      action: 'VITALS_CONFIRM',
      targetType: 'Queue',
      targetId: queueId,
      performedBy: queueItem.assignedTo, // Approximating to assigned doctor or generic staff
      role: 'staff',
      reason: `Vitals Updated: H:${height}cm W:${weight}kg`
    });

    res.json({ success: true, message: "Vitals confirmed", data: updated });

  } catch (err) {
    console.error("Vitals Confirm Error:", err);
    res.status(500).json({ success: false, message: "Failed to confirm vitals" });
  }
});


// === PUT: Update Status (Restricted) ===
router.put('/update/:id', protect, async (req, res) => {
  try {
    const { status, notes } = req.body; // paymentStatus REMOVED
    const updates = {};

    if (status) {
      updates.status = status;
      if (status === 'In-Cabin') updates.calledTime = new Date();
      if (status === 'Completed') updates.completedTime = new Date();
    }

    if (notes) updates.notes = notes;

    const updated = await Queue.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignedTo', 'name')
      .populate('patientId', 'name mobile')
      .populate('consultationPassId');

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
      reason: `Status Update: ${status}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Queue Update Error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// === POST: Notify Staff (Doctor Request) ===
// === POST: Notify Staff (Doctor Request) ===
router.post('/notify-staff', protect, async (req, res) => {
  try {
    const { queueId, message, doctorId } = req.body;

    let doctorName = 'Unknown Doctor';
    let patientName = '';
    let tokenNumber = '';
    let actualDoctorId = doctorId;

    if (queueId) {
      // Validate queue exists
      const queueItem = await Queue.findById(queueId)
        .populate('patientId', 'name')
        .populate('assignedTo', 'name');

      if (queueItem) {
        actualDoctorId = queueItem.assignedTo._id;
        doctorName = queueItem.assignedTo.name;
        patientName = queueItem.patientId ? queueItem.patientId.name : 'Unknown';
        tokenNumber = queueItem.tokenNumber;
      }
    } else if (doctorId) {
      const doctor = await User.findById(doctorId);
      if (doctor) {
        doctorName = doctor.name;
      }
    }

    if (!actualDoctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID or Queue ID required" });
    }

    // Emit Notification Event
    if (req.io) {
      req.io.emit('staff_notification', {
        type: 'DOCTOR_REQUEST',
        message: message || `Doctor Request from ${doctorName}`,
        queueId: queueId || null,
        doctorId: actualDoctorId,
        patientName: patientName,
        tokenNumber: tokenNumber
      });
    }

    res.json({ success: true, message: "Staff notified successfully" });
  } catch (err) {
    console.error("Notify Staff Error:", err);
    res.status(500).json({ success: false, message: "Failed to notify staff" });
  }
});

// === POST: Register Patient and Add to Queue ===
router.post('/register-queue', async (req, res) => {
  try {
    const { patientId, assignedTo, chiefComplaint } = req.body;

    // 1. Find or Create Patient (User)
    let user;
    if (patientId) {
      user = await User.findById(patientId);
      if (!user) {
        return res.status(404).json({ success: false, message: "Patient not found." });
      }
    } else {
      // This block would typically handle new patient registration if not provided
      return res.status(400).json({ success: false, message: "Patient ID is required for adding to queue." });
    }

    // 2. Check for Active Queue
    const activeQueue = await Queue.findOne({
      patientId: user._id,
      status: { $in: ['Waiting', 'In-Cabin'] }
    });

    if (activeQueue) {
      return res.status(400).json({ success: false, message: "Patient is already in a queue." });
    }

    // 3. Add to Queue
    const tokenNumber = await generateTokenNumber(assignedTo, new Date());

    const newQueue = new Queue({
      patientId: user._id,
      assignedTo,
      tokenNumber,
      status: "Waiting",
      appointmentDate: new Date(),
      visitType: "New", // Default for new reg
      bookingSource: "Walk-in",
      chiefComplaint: chiefComplaint || "Walk-in Registration"
    });

    await newQueue.save();

    res.json({ success: true, message: "Patient Registered & Added to Queue", data: newQueue });
  } catch (err) {
    console.error("Register Queue Error:", err);
    res.status(500).json({ success: false, message: "Registration failed." });
  }
});

// === DELETE: Cancel Token ===
router.delete('/delete/:id', protect, async (req, res) => {
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