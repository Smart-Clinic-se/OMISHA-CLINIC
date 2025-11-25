require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const migrateAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI missing in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.log("⚠️ No admin user found.");
            process.exit(0);
        }

        if (!admin.username) {
            console.log("⚠️ Admin user missing username. Fixing...");
            admin.username = 'admin'; // Default username for admin

            // We need to bypass validation or ensure other fields are valid. 
            // Since we are just fixing the username, we can try saving.
            // If other fields are invalid, we might need to fix them too.
            // But let's assume only username is the issue for now as per the error.

            await admin.save();
            console.log("✅ Admin user updated with username: 'admin'");
        } else {
            console.log(`✅ Admin user already has username: ${admin.username}`);
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
};

migrateAdmin();
