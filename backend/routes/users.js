const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// === HELPER: Manually Extract User from Token (Since we have no global middleware) ===
const getUserFromToken = (req) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (err) {
        return null;
    }
};

// === 1. UPDATE THEME PREFERENCE ===
router.patch('/theme', async (req, res) => {
    try {
        const decoded = getUserFromToken(req);
        if (!decoded) return res.status(401).json({ message: "Unauthorized" });

        const { theme } = req.body;
        if (!['light', 'dark', 'system'].includes(theme)) {
            return res.status(400).json({ message: "Invalid theme preference." });
        }

        const user = await User.findByIdAndUpdate(
            decoded.id,
            { themePreference: theme },
            { new: true }
        ).select('-password -securityAnswer');

        if (!user) return res.status(404).json({ message: "User not found." });

        res.json({ success: true, user });
    } catch (err) {
        console.error("Update Theme Error:", err);
        res.status(500).json({ message: "Failed to update theme preference." });
    }
});

const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// === 2. UPDATE PROFILE PHOTO ===
router.patch('/profile-photo', upload.single('photo'), async (req, res) => {
    try {
        const decoded = getUserFromToken(req);
        if (!decoded) return res.status(401).json({ message: "Unauthorized" });

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const user = await User.findByIdAndUpdate(
            decoded.id,
            { photo: req.file.path },
            { new: true }
        ).select('-password -securityAnswer');

        if (!user) return res.status(404).json({ message: "User not found." });

        res.json({ success: true, user, message: "Profile photo updated successfully." });
    } catch (err) {
        console.error("Update Photo Error:", err);
        res.status(500).json({ message: "Failed to update profile photo." });
    }
});

// === 3. UPDATE PROFESSIONAL PROFILE (DOCTOR) ===
router.patch('/profile', async (req, res) => {
    try {
        const decoded = getUserFromToken(req);
        if (!decoded) return res.status(401).json({ message: "Unauthorized" });

        const { consultationFee, qualification, experience, hospitalName, specialization } = req.body;

        // Construct update object with allowed fields only
        const updates = {};
        if (consultationFee !== undefined) updates.consultationFee = Number(consultationFee);
        if (qualification !== undefined) updates.qualification = qualification;
        if (experience !== undefined) updates.experience = experience;
        if (hospitalName !== undefined) updates.hospitalName = hospitalName;
        if (specialization !== undefined) updates.specialization = specialization;

        const user = await User.findByIdAndUpdate(
            decoded.id,
            { $set: updates },
            { new: true } // Return updated doc
        ).select('-password -securityAnswer');

        if (!user) return res.status(404).json({ message: "User not found." });

        res.json({ success: true, user, message: "Profile updated successfully." });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ message: "Failed to update profile." });
    }
});

module.exports = router;
