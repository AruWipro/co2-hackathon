require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('../config/database');
const EnergyMetrics = require('../models/EnergyMetrics');

async function checkData() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // Get all documents
        const allDocs = await EnergyMetrics.find({}).lean();
        console.log('Total documents:', allDocs.length);

        if (allDocs.length > 0) {
            console.log('Sample document:', JSON.stringify(allDocs[0], null, 2));

            // Check specific container and namespace
            const specificDocs = await EnergyMetrics.find({
                'co2Estimate.trace.container': 'skills-financial',
                'co2Estimate.trace.namespace': 'contactcenterservices'
            }).lean();

            console.log('\nDocuments matching skills-financial container:', specificDocs.length);

            if (specificDocs.length > 0) {
                console.log('Sample matching document trace:',
                    JSON.stringify(specificDocs[0].co2Estimate.trace, null, 2));
            }
        }

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

checkData(); 