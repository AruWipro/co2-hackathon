const mongoose = require('mongoose');
const moment = require('moment');
const dbConfig = require('../config/database');
const EnergyMetrics = require('../models/EnergyMetrics');

async function checkAllData() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // Get all documents
        const allDocs = await EnergyMetrics.find({}).lean();

        console.log('\nTotal documents:', allDocs.length);

        if (allDocs.length > 0) {
            // Show first document
            console.log('\nFirst document:', JSON.stringify(allDocs[0], null, 2));

            // Show all timestamps
            console.log('\nAll timestamps:');
            allDocs.forEach(doc => {
                console.log(moment(doc.timestamp).utc().format('YYYY-MM-DD HH:mm:ss UTC'));
            });
        } else {
            console.log('\nNo documents found in the database');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

checkAllData(); 