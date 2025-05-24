const mongoose = require('mongoose');
const dbConfig = require('../config/database');
const EnergyMetrics = require('../models/EnergyMetrics');

async function queryEnergyMetrics() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // 1. Get all records for a specific date range
        const dateRangeResults = await EnergyMetrics.find({
            timestamp: {
                $gte: new Date('2025-05-22T00:00:00.000Z'),
                $lte: new Date('2025-05-24T00:00:00.000Z')
            }
        }).sort({ timestamp: -1 });

        console.log('\n1. Records in date range:', dateRangeResults.length);
        console.log('Sample record:', JSON.stringify(dateRangeResults[0], null, 2));

        // 2. Get aggregated energy metrics by container
        const containerStats = await EnergyMetrics.aggregate([
            {
                $group: {
                    _id: '$container',
                    avgTotalEnergy: { $avg: '$totalEnergy_J' },
                    avgCpuEnergy: { $avg: '$cpuEnergy_J' },
                    avgRamEnergy: { $avg: '$ramEnergy_J' },
                    totalExecutions: { $sum: 1 }
                }
            }
        ]);

        console.log('\n2. Energy stats by container:', JSON.stringify(containerStats, null, 2));

        // 3. Find records with specific container and high energy usage
        const highEnergyUsage = await EnergyMetrics.find({
            container: 'skills-financial',
            totalEnergy_J: { $gt: 650 }
        }).select('timestamp totalEnergy_J cpuEnergy_J container');

        console.log('\n3. High energy usage records:', JSON.stringify(highEnergyUsage, null, 2));

        // 4. Get child operations (trace) statistics
        const childStats = await EnergyMetrics.aggregate([
            { $unwind: '$trace' },
            {
                $group: {
                    _id: '$trace.container',
                    avgExecutionTime: { $avg: '$trace.total_executionTime_MS' },
                    avgEnergy: { $avg: '$trace.totalEnergy_J' },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n4. Child operations statistics:', JSON.stringify(childStats, null, 2));

        // 5. Get latest record with full trace
        const latestRecord = await EnergyMetrics.findOne()
            .sort({ timestamp: -1 })
            .select('timestamp container totalEnergy_J trace');

        console.log('\n5. Latest record with trace:', JSON.stringify(latestRecord, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nMongoDB connection closed');
    }
}

// Run the queries
queryEnergyMetrics(); 