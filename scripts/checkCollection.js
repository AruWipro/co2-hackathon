const mongoose = require('mongoose');
const dbConfig = require('../config/database');

async function checkCollection() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // Get list of collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections in database:');
        collections.forEach(coll => {
            console.log(`- ${coll.name}`);
        });

        // Check energy_metrics collection
        const db = mongoose.connection.db;
        const energyMetrics = await db.collection('energy_metrics').find({}).toArray();

        console.log('\nTotal documents in energy_metrics:', energyMetrics.length);

        if (energyMetrics.length > 0) {
            console.log('\nSample document:', JSON.stringify(energyMetrics[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

checkCollection(); 