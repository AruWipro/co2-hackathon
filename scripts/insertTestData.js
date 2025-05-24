require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');
const dbConfig = require('../config/database');
const EnergyMetrics = require('../models/EnergyMetrics');

const generateSampleData = (timestamp, energyMultiplier = 1) => ({
    timestamp,
    container: "skills-financial",
    namespace: "contactcenterservices",
    apiName: "get-product-transactions",
    methodName: "GET",
    total_executionTime_MS: 9100 * energyMultiplier,
    cpuTime_MS: 977.19 * energyMultiplier,
    memoryUsed_MB: 13.06 * energyMultiplier,
    cpuEnergy_J: 658.42 * energyMultiplier,
    ramEnergy_J: 0.00317 * energyMultiplier,
    totalEnergy_J: 658.42317 * energyMultiplier,
    path: "/contactcenter/self-service/skills/fin/product-transactions/v1",
    trace: [
        {
            container: "skills-financial-child",
            namespace: "contactcenterservices",
            apiName: "process-transaction",
            methodName: "POST",
            path: "/internal/transaction-processor",
            total_executionTime_MS: 4550 * energyMultiplier,
            cpuTime_MS: 488.59 * energyMultiplier,
            memoryUsed_MB: 6.53 * energyMultiplier,
            cpuEnergy_J: 329.21 * energyMultiplier,
            ramEnergy_J: 0.00158 * energyMultiplier,
            totalEnergy_J: 329.21158 * energyMultiplier
        },
        {
            container: "skills-financial-db",
            namespace: "contactcenterservices",
            apiName: "query-transactions",
            methodName: "GET",
            path: "/db/query",
            total_executionTime_MS: 2275 * energyMultiplier,
            cpuTime_MS: 244.29 * energyMultiplier,
            memoryUsed_MB: 3.265 * energyMultiplier,
            cpuEnergy_J: 164.605 * energyMultiplier,
            ramEnergy_J: 0.00079 * energyMultiplier,
            totalEnergy_J: 164.60579 * energyMultiplier
        }
    ]
});

// Generate additional sample data with different APIs
const generateAdditionalSampleData = (timestamp, energyMultiplier = 1) => ({
    timestamp,
    container: "skills-financial",
    namespace: "contactcenterservices",
    apiName: "create-transaction",
    methodName: "POST",
    total_executionTime_MS: 12000 * energyMultiplier,
    cpuTime_MS: 1200 * energyMultiplier,
    memoryUsed_MB: 15 * energyMultiplier,
    cpuEnergy_J: 800 * energyMultiplier,
    ramEnergy_J: 0.004 * energyMultiplier,
    totalEnergy_J: 800.004 * energyMultiplier,
    path: "/contactcenter/self-service/skills/fin/transactions/create",
    trace: [
        {
            container: "skills-financial-child",
            namespace: "contactcenterservices",
            apiName: "validate-transaction",
            methodName: "POST",
            path: "/internal/transaction-validator",
            total_executionTime_MS: 3000 * energyMultiplier,
            cpuTime_MS: 300 * energyMultiplier,
            memoryUsed_MB: 8 * energyMultiplier,
            cpuEnergy_J: 200 * energyMultiplier,
            ramEnergy_J: 0.002 * energyMultiplier,
            totalEnergy_J: 200.002 * energyMultiplier
        },
        {
            container: "skills-financial-db",
            namespace: "contactcenterservices",
            apiName: "insert-transaction",
            methodName: "POST",
            path: "/db/insert",
            total_executionTime_MS: 2000 * energyMultiplier,
            cpuTime_MS: 200 * energyMultiplier,
            memoryUsed_MB: 4 * energyMultiplier,
            cpuEnergy_J: 150 * energyMultiplier,
            ramEnergy_J: 0.001 * energyMultiplier,
            totalEnergy_J: 150.001 * energyMultiplier
        }
    ]
});

async function insertTestData() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // Clear existing test data
        await EnergyMetrics.deleteMany({});
        console.log('Cleared existing test data');

        // Use current date as reference and force 2025
        const now = moment().utc();
        now.year(2025).month(4).date(24); // Set to May 24, 2025
        now.hours(0).minutes(0).seconds(0).milliseconds(0); // Start of day in UTC

        console.log('Reference date:', now.format('YYYY-MM-DD HH:mm:ss UTC'));

        // Insert data for the last 7 days
        for (let i = 0; i < 7; i++) {
            const dayDate = moment(now).subtract(i, 'days');
            const timestamp = new Date(Date.UTC(
                dayDate.year(),
                dayDate.month(),
                dayDate.date(),
                0, 0, 0, 0
            ));
            const energyMultiplier = 1 + (Math.random() * 0.5); // Random variation
            
            // Insert both types of sample data
            const dayData1 = generateSampleData(timestamp, energyMultiplier);
            const dayData2 = generateAdditionalSampleData(timestamp, energyMultiplier);

            const metric1 = new EnergyMetrics(dayData1);
            const metric2 = new EnergyMetrics(dayData2);
            
            await metric1.save();
            await metric2.save();
            
            console.log(`Inserted data for day -${i}, timestamp: ${moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss')} UTC`);
        }

        // Insert data for the previous week (for comparison)
        for (let i = 7; i < 14; i++) {
            const dayDate = moment(now).subtract(i, 'days');
            const timestamp = new Date(Date.UTC(
                dayDate.year(),
                dayDate.month(),
                dayDate.date(),
                0, 0, 0, 0
            ));
            const energyMultiplier = 0.8 + (Math.random() * 0.5); // Slightly lower values for previous week
            
            // Insert both types of sample data
            const dayData1 = generateSampleData(timestamp, energyMultiplier);
            const dayData2 = generateAdditionalSampleData(timestamp, energyMultiplier);

            const metric1 = new EnergyMetrics(dayData1);
            const metric2 = new EnergyMetrics(dayData2);
            
            await metric1.save();
            await metric2.save();
            
            console.log(`Inserted data for day -${i}, timestamp: ${moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss')} UTC`);
        }

        // Print summary
        const allData = await EnergyMetrics.find({}).lean().sort({ timestamp: -1 });
        console.log('\nData Summary:');
        console.log('Total documents:', allData.length);

        // Show sample document
        if (allData.length > 0) {
            const sample = allData[0];
            console.log('\nSample document:', JSON.stringify({
                timestamp: moment(sample.timestamp).utc().format(),
                container: sample.container,
                namespace: sample.namespace,
                apiName: sample.apiName,
                methodName: sample.methodName,
                totalEnergy_J: sample.totalEnergy_J,
                cpuEnergy_J: sample.cpuEnergy_J,
                ramEnergy_J: sample.ramEnergy_J,
                total_executionTime_MS: sample.total_executionTime_MS,
                memoryUsed_MB: sample.memoryUsed_MB,
                path: sample.path,
                trace: sample.trace ? sample.trace.map(t => ({
                    container: t.container,
                    namespace: t.namespace,
                    apiName: t.apiName,
                    methodName: t.methodName,
                    path: t.path,
                    totalEnergy_J: t.totalEnergy_J,
                    cpuEnergy_J: t.cpuEnergy_J,
                    ramEnergy_J: t.ramEnergy_J,
                    total_executionTime_MS: t.total_executionTime_MS,
                    memoryUsed_MB: t.memoryUsed_MB
                })) : []
            }, null, 2));
        }

        console.log('\nAll test data inserted successfully');

    } catch (error) {
        console.error('Error inserting test data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

insertTestData(); 