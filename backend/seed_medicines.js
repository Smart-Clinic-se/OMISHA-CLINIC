require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Medicine = require('./models/Medicine');

// Connect to DB
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected for Seeding"))
    .catch(err => {
        console.error("❌ MongoDB Connection Failed:", err.message);
        process.exit(1);
    });

const seedMedicines = async () => {
    try {
        const jsonPath = path.join(__dirname, '../frontend/public/data/medicine_db.json');
        console.log(`📂 Reading data from: ${jsonPath}`);

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const medicines = JSON.parse(rawData);

        console.log(`📊 Found ${medicines.length} records in JSON.`);

        // Clear existing data
        console.log('🗑️  Clearing existing medicines...');
        await Medicine.deleteMany({});

        // Transform and Insert
        // Note: The JSON structure matches our schema keys mostly.
        // We'll map just to be safe and clean.
        const docs = medicines.map(m => ({
            name: m.name,
            type: m.type || (m.dosage_form?.includes('ml') ? "Syrup/Liquid" : "Tablet/Capsule"), // Fallback if type missing
            strength: m.strength,
            dosage_form: m.dosage_form,
            category: m.category,
            price: m.price ? parseFloat(m.price) : 0
        }));

        console.log('🚀 Inserting data into MongoDB...');
        // Insert in batches to match MongoDB limits if needed, but 5000 is fine for one go usually.
        // For safety/logs, let's just do insertMany.
        await Medicine.insertMany(docs);

        console.log(`✅ Successfully seeded ${docs.length} medicines!`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedMedicines();
