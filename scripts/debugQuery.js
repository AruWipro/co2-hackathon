const mongoose = require('mongoose');
const moment = require('moment');
const dbConfig = require('../config/database');
const EnergyMetrics = require('../models/EnergyMetrics');

async function debugQuery() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // Get current filter range (same as controller)
        const now = moment().utc();
        now.year(2025).month(4).date(24); // Set to May 24, 2025
        now.hours(0).minutes(0).seconds(0).milliseconds(0); // Start of day in UTC

        const timeFilter = {
            $gte: new Date(Date.UTC(2025, 4, 17, 0, 0, 0, 0)), // May 17, 2025 00:00:00 UTC
            $lte: new Date(Date.UTC(2025, 4, 24, 23, 59, 59, 999)) // May 24, 2025 23:59:59.999 UTC
        };

        console.log('\nTime Filter:', {
            $gte: moment(timeFilter.$gte).format('YYYY-MM-DD HH:mm:ss UTC'),
            $lte: moment(timeFilter.$lte).format('YYYY-MM-DD HH:mm:ss UTC')
        });

        // First, find all documents in the time range
        const rawDocs = await EnergyMetrics.find({
            timestamp: timeFilter
        }).lean();

        console.log('\nFound documents in time range:', rawDocs.length);

        // Check specific container and namespace
        const namespace = 'contactcenterservices';
        const container = 'skills-financial';

        // Run the aggregation pipeline for main metrics
        const metrics = await EnergyMetrics.aggregate([
            {
                $match: {
                    timestamp: timeFilter,
                    namespace: namespace,
                    container: container
                }
            },
            {
                $group: {
                    _id: null,
                    total_energy: { $sum: '$totalEnergy_J' },
                    cpu_energy: { $sum: '$cpuEnergy_J' },
                    ram_energy: { $sum: '$ramEnergy_J' },
                    avg_execution_time: { $avg: '$total_executionTime_MS' },
                    memory_used: { $sum: '$memoryUsed_MB' }
                }
            }
        ]);

        console.log('\nMain Metrics:', metrics);

        // Run aggregation for trace metrics
        const traceMetrics = await EnergyMetrics.aggregate([
            {
                $match: {
                    timestamp: timeFilter
                }
            },
            { $unwind: '$trace' },
            {
                $group: {
                    _id: '$trace.container',
                    total_energy: { $sum: '$trace.totalEnergy_J' },
                    cpu_energy: { $sum: '$trace.cpuEnergy_J' },
                    ram_energy: { $sum: '$trace.ramEnergy_J' },
                    avg_execution_time: { $avg: '$trace.total_executionTime_MS' }
                }
            }
        ]);

        console.log('\nTrace Metrics by Container:', traceMetrics);

        // Show sample document structure
        if (rawDocs.length > 0) {
            console.log('\nSample Document Structure:');
            const sample = rawDocs[0];
            console.log(JSON.stringify({
                timestamp: sample.timestamp,
                container: sample.container,
                namespace: sample.namespace,
                totalEnergy_J: sample.totalEnergy_J,
                cpuEnergy_J: sample.cpuEnergy_J,
                ramEnergy_J: sample.ramEnergy_J,
                trace: sample.trace.map(t => ({
                    container: t.container,
                    totalEnergy_J: t.totalEnergy_J,
                    cpuEnergy_J: t.cpuEnergy_J,
                    ramEnergy_J: t.ramEnergy_J
                }))
            }, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

debugQuery(); 