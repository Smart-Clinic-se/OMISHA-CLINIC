const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getUserFromToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// === HELPER FUNCTIONS ===
const generateSystemId = (role) => {
  const prefix = role ? role.toUpperCase().substring(0, 3) : 'USR';
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
};

const generateUsername = (firstName, lastName) => {
  if (!firstName || !lastName) return '';
  return `${firstName.toLowerCase()}_${lastName.toLowerCase()}`;
};

const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

// === 1. REGISTER PATIENT ===
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, mobile, password, dob, gender, address, bloodGroup, securityQuestion, securityAnswer } = req.body;

    // Check if user exists
    let user = await User.findOne({ mobile });
    if (user) return res.status(400).json({ message: "User already exists with this mobile number." });

    // Generate Username: firstname_lastname
    let baseUsername = `${firstName.trim().toLowerCase()}_${lastName.trim().toLowerCase()}`;
    let finalUsername = baseUsername;
    let counter = 1;

    // Check for duplicate username and append counter if needed
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const newUser = new User({
      username: finalUsername,
      name: `${firstName} ${lastName}`,
      mobile,
      password,
      role: 'patient',
      dob,
      gender,
      address,
      bloodGroup,
      securityQuestion,
      securityAnswer,
      systemId: generateSystemId('patient')
    });

    await newUser.save();

    await AuditLog.create({
      action: 'REGISTER',
      targetType: 'User',
      targetId: newUser._id,
      performedBy: newUser._id,
      role: 'patient',
      reason: 'New Patient Registration'
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      credentials: { username: finalUsername, password: password }
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// === 2. LOGIN ===
router.post('/login', async (req, res) => {
  try {
    const { loginInput, password, role } = req.body;

    if (!loginInput || !password) {
      return res.status(400).json({ message: "Please provide login credentials." });
    }

    const user = await User.findOne({
      $or: [
        { mobile: loginInput },
        { username: { $regex: new RegExp(`^${loginInput}$`, 'i') } }
      ]
    });

    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({ message: `Access denied. You are not a ${role}.` });
    }

    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    user.sessionId = sessionId;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, sessionId },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "12h" }
    );

    await AuditLog.create({
      action: 'LOGIN',
      targetType: 'User',
      targetId: user._id,
      performedBy: user._id,
      role: user.role,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        mobile: user.mobile,
        role: user.role,
        specialization: user.specialization,
        availabilityStatus: user.availabilityStatus,
        systemId: user.systemId,
        bloodGroup: user.bloodGroup,
        securityQuestion: user.securityQuestion, // Send back so frontend knows if it exists
        themePreference: user.themePreference
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed. Try again." });
  }
});

// === 3. GET SECURITY QUESTION ===
router.post('/get-security-question', async (req, res) => {
  try {
    const { loginInput } = req.body;
    const user = await User.findOne({
      $or: [
        { mobile: loginInput },
        { username: { $regex: new RegExp(`^${loginInput}$`, 'i') } }
      ]
    });

    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.securityQuestion) return res.status(400).json({ message: "No security question set for this account." });

    res.json({ success: true, question: user.securityQuestion });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// === 4. RESET PASSWORD ===
router.post('/reset-password', async (req, res) => {
  try {
    const { loginInput, securityAnswer, newPassword } = req.body;

    const user = await User.findOne({
      $or: [
        { mobile: loginInput },
        { username: { $regex: new RegExp(`^${loginInput}$`, 'i') } }
      ]
    });

    if (!user) return res.status(404).json({ message: "User not found." });

    const normalizedAnswer = securityAnswer.trim().toLowerCase();
    const isMatch = await bcrypt.compare(normalizedAnswer, user.securityAnswer);

    if (!isMatch) return res.status(400).json({ message: "Incorrect security answer." });

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_RESET',
      targetType: 'User',
      targetId: user._id,
      performedBy: user._id,
      role: user.role,
      reason: 'Forgot Password Recovery'
    });

    res.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// === 5. CHANGE PASSWORD ===
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, securityAnswer } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

    // Verify Security Answer if user has one set
    if (user.securityQuestion) {
      if (!securityAnswer) {
        return res.status(400).json({ message: "Security answer is required." });
      }
      const normalizedAnswer = securityAnswer.trim().toLowerCase();
      const isSecMatch = await bcrypt.compare(normalizedAnswer, user.securityAnswer);
      if (!isSecMatch) return res.status(400).json({ message: "Incorrect security answer." });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_CHANGE',
      targetType: 'User',
      targetId: user._id,
      performedBy: user._id,
      role: user.role,
      reason: 'User changed password'
    });

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// === 6. REGISTER STAFF/DOCTOR (Admin Only) ===
router.post('/register-staff', upload.single('photo'), async (req, res) => {
  try {
    console.log("Register Staff Request Body:", req.body);
    console.log("Register Staff Request File:", req.file);

    const { firstName, lastName, mobile, role, specialization, qualification, experience, hospitalName } = req.body;
    let photo = req.body.photo;

    if (req.file) {
      photo = req.file.path;
    }

    if (!firstName || !lastName || !mobile || !role) {
      return res.status(400).json({ message: "Required fields missing." });
    }

    // Generate Username: firstname_lastname
    let baseUsername = `${firstName.trim().toLowerCase()}_${lastName.trim().toLowerCase()}`;
    let finalUsername = baseUsername;
    let counter = 1;

    // Check for duplicate username and append counter if needed
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) return res.status(409).json({ message: "Mobile number already registered." });

    const user = new User({
      name: `${firstName} ${lastName}`,
      username: finalUsername,
      mobile,
      password: "123456", // Default Password
      role,
      specialization: role === 'doctor' ? specialization : '',
      qualification: role === 'doctor' ? qualification : '',
      experience: role === 'doctor' ? experience : '',
      hospitalName: role === 'doctor' ? (hospitalName || 'Omisha Clinic') : '',
      photo: role === 'doctor' ? photo : '',
      availabilityStatus: role === 'doctor' ? 'Not Available' : undefined,
      systemId: generateSystemId(role),
      securityQuestion: null,
      securityAnswer: null
    });

    await user.save();

    // Return generated credentials
    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} registered successfully.`,
      credentials: {
        username: finalUsername,
        password: "123456"
      }
    });
  } catch (err) {
    console.error("Register Staff Error:", err);
    res.status(500).json({ message: "Failed to register user.", error: err.message });
  }
});

// === 7. GET DOCTORS ===
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name specialization qualification experience hospitalName photo gender availabilityStatus breakUntil weeklySchedule consultationFee');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch doctors." });
  }
});

// === 8. SEARCH USERS ===
router.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: { $regex: regex } },
        { mobile: { $regex: regex } },
        { username: { $regex: regex } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// === 9. UPDATE AVAILABILITY ===
router.patch('/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, breakDuration } = req.body;
    const updateData = { availabilityStatus: status };

    if (status === 'On Break' && breakDuration) {
      updateData.breakUntil = new Date(Date.now() + breakDuration * 60 * 1000);
    } else {
      updateData.breakUntil = null;
    }

    const doctor = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('name availabilityStatus breakUntil');

    if (req.io) {
      req.io.emit('doctor_status_update', {
        doctorId: doctor._id,
        status: doctor.availabilityStatus,
        breakUntil: doctor.breakUntil
      });
    }
    res.json({ success: true, doctor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status." });
  }
});

// === 10. GET AUDIT LOGS ===
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('performedBy', 'name role systemId');

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs." });
  }
});

// === 11. GET CURRENT USER (Protected Manually) ===
router.get('/me', async (req, res) => {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(decoded.id).select('-password -securityAnswer');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// === 12. COMPLETE SECURITY SETUP (First Login) ===
router.post('/complete-security-setup', async (req, res) => {
  try {
    const { userId, newPassword, securityQuestion, securityAnswer } = req.body;

    if (!userId || !newPassword || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Update Password and Security Q&A
    user.password = newPassword;
    user.securityQuestion = securityQuestion;
    user.securityAnswer = securityAnswer; // Will be hashed by pre-save hook

    await user.save();

    await AuditLog.create({
      action: 'SECURITY_SETUP',
      targetType: 'User',
      targetId: user._id,
      performedBy: user._id,
      role: user.role,
      reason: 'Completed initial security setup'
    });

    res.json({ success: true, message: "Security setup completed successfully." });
  } catch (err) {
    console.error("Security Setup Error:", err);
    res.status(500).json({ message: "Failed to complete security setup.", error: err.message });
  }
});

module.exports = router;