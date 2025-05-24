require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment');
const dbConfig = require('../config/database');
const EnergyMetrics = require('../models/EnergyMetrics');

const generateLoanData = (timestamp, energyMultiplier = 1) => ({
    timestamp,
    container: "skills-loans",
    namespace: "contactcenterservices",
    apiName: "loans-details",
    methodName: "GET",
    total_executionTime_MS: 7500 * energyMultiplier,
    cpuTime_MS: 850 * energyMultiplier,
    memoryUsed_MB: 18 * energyMultiplier,
    cpuEnergy_J: 580 * energyMultiplier,
    ramEnergy_J: 0.004 * energyMultiplier,
    totalEnergy_J: 580.004 * energyMultiplier,
    path: "/apiloan-details/v1",
    trace: [
        {
            container: "bawaba-loan-details",
            namespace: "contactcenterservices",
            apiName: "bawaba-loan-details",
            methodName: "GET",
            path: "/apiloan-details/v1",
            total_executionTime_MS: 3750 * energyMultiplier,
            cpuTime_MS: 425 * energyMultiplier,
            memoryUsed_MB: 9 * energyMultiplier,
            cpuEnergy_J: 290 * energyMultiplier,
            ramEnergy_J: 0.002 * energyMultiplier,
            totalEnergy_J: 290.002 * energyMultiplier
        }
    ]
});

const generateVoiceStreamData = (timestamp, energyMultiplier = 1) => ({
    timestamp,
    container: "conversation-orchestrator",
    namespace: "contactcenterservices",
    apiName: "voice-stream",
    methodName: "POST",
    total_executionTime_MS: 15000 * energyMultiplier,
    cpuTime_MS: 1500 * energyMultiplier,
    memoryUsed_MB: 25 * energyMultiplier,
    cpuEnergy_J: 1000 * energyMultiplier,
    ramEnergy_J: 0.005 * energyMultiplier,
    totalEnergy_J: 1000.005 * energyMultiplier,
    path: "/api/voice/stream/v1",
    trace: [
        {
            container: "skills-financial",
            namespace: "contactcenterservices",
            apiName: "get-product-balance-stream",
            methodName: "GET",
            path: "/product-balance/stream/v1",
            total_executionTime_MS: 7500 * energyMultiplier,
            cpuTime_MS: 750 * energyMultiplier,
            memoryUsed_MB: 12.5 * energyMultiplier,
            cpuEnergy_J: 500 * energyMultiplier,
            ramEnergy_J: 0.0025 * energyMultiplier,
            totalEnergy_J: 500.0025 * energyMultiplier
        }
    ]
});

const generateChatData = (timestamp, energyMultiplier = 1) => ({
    timestamp,
    container: "conversation-orchestrator",
    namespace: "contactcenterservices",
    apiName: "chat",
    methodName: "POST",
    total_executionTime_MS: 8000 * energyMultiplier,
    cpuTime_MS: 800 * energyMultiplier,
    memoryUsed_MB: 20 * energyMultiplier,
    cpuEnergy_J: 600 * energyMultiplier,
    ramEnergy_J: 0.003 * energyMultiplier,
    totalEnergy_J: 600.003 * energyMultiplier,
    path: "/api/chat/v1",
    trace: [
        {
            container: "skills-financial",
            namespace: "contactcenterservices",
            apiName: "get-product-balance",
            methodName: "GET",
            path: "/product-balance/v1",
            total_executionTime_MS: 4000 * energyMultiplier,
            cpuTime_MS: 400 * energyMultiplier,
            memoryUsed_MB: 10 * energyMultiplier,
            cpuEnergy_J: 300 * energyMultiplier,
            ramEnergy_J: 0.0015 * energyMultiplier,
            totalEnergy_J: 300.0015 * energyMultiplier
        },
        {
            container: "skills-loans",
            namespace: "contactcenterservices",
            apiName: "get-loan-status",
            methodName: "GET",
            path: "/loan-status/v1",
            total_executionTime_MS: 2000 * energyMultiplier,
            cpuTime_MS: 200 * energyMultiplier,
            memoryUsed_MB: 5 * energyMultiplier,
            cpuEnergy_J: 150 * energyMultiplier,
            ramEnergy_J: 0.00075 * energyMultiplier,
            totalEnergy_J: 150.00075 * energyMultiplier
        }
    ]
});

const generateChatStreamData = (timestamp, energyMultiplier = 1) => ({
    timestamp,
    container: "conversation-orchestrator",
    namespace: "contactcenterservices",
    apiName: "chat-stream",
    methodName: "POST",
    total_executionTime_MS: 12000 * energyMultiplier,
    cpuTime_MS: 1200 * energyMultiplier,
    memoryUsed_MB: 22 * energyMultiplier,
    cpuEnergy_J: 800 * energyMultiplier,
    ramEnergy_J: 0.004 * energyMultiplier,
    totalEnergy_J: 800.004 * energyMultiplier,
    path: "/api/chat-stream/v1",
    trace: [
        {
            container: "skills-financial",
            namespace: "contactcenterservices",
            apiName: "get-product-balance-stream",
            methodName: "GET",
            path: "/product-balance/stream/v1",
            total_executionTime_MS: 6000 * energyMultiplier,
            cpuTime_MS: 600 * energyMultiplier,
            memoryUsed_MB: 11 * energyMultiplier,
            cpuEnergy_J: 400 * energyMultiplier,
            ramEnergy_J: 0.002 * energyMultiplier,
            totalEnergy_J: 400.002 * energyMultiplier
        },
        {
            container: "skills-loans",
            namespace: "contactcenterservices",
            apiName: "get-loan-status-stream",
            methodName: "GET",
            path: "/loan-status/stream/v1",
            total_executionTime_MS: 3000 * energyMultiplier,
            cpuTime_MS: 300 * energyMultiplier,
            memoryUsed_MB: 5.5 * energyMultiplier,
            cpuEnergy_J: 200 * energyMultiplier,
            ramEnergy_J: 0.001 * energyMultiplier,
            totalEnergy_J: 200.001 * energyMultiplier
        }
    ]
});

async function insertOrchestratorData() {
    try {
        await mongoose.connect(dbConfig.mongodb.url, dbConfig.mongodb.options);
        console.log('Connected to MongoDB');

        // Use current date as reference and force 2025
        const now = moment().utc();
        now.year(2025).month(4).date(24); // Set to May 24, 2025
        now.hours(0).minutes(0).seconds(0).milliseconds(0); // Start of day in UTC

        console.log('Reference date:', now.format('YYYY-MM-DD HH:mm:ss UTC'));

        // Insert data for the last 14 days
        for (let i = 0; i < 14; i++) {
            const dayDate = moment(now).subtract(i, 'days');
            const timestamp = new Date(Date.UTC(
                dayDate.year(),
                dayDate.month(),
                dayDate.date(),
                0, 0, 0, 0
            ));
            
            // Generate random variations for each day
            const chatMultiplier = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
            const chatStreamMultiplier = 0.9 + (Math.random() * 0.6); // 0.9 to 1.5
            const voiceStreamMultiplier = 0.9 + (Math.random() * 0.6); // 0.9 to 1.5

            // Insert chat data
            const chatData = generateChatData(timestamp, chatMultiplier);
            const chatMetric = new EnergyMetrics(chatData);
            await chatMetric.save();
            console.log(`Inserted chat data for day -${i}, timestamp: ${moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss')} UTC`);

            // Insert chat stream data
            const chatStreamData = generateChatStreamData(timestamp, chatStreamMultiplier);
            const chatStreamMetric = new EnergyMetrics(chatStreamData);
            await chatStreamMetric.save();
            console.log(`Inserted chat stream data for day -${i}, timestamp: ${moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss')} UTC`);

            // Insert voice stream data
            const voiceData = generateVoiceStreamData(timestamp, voiceStreamMultiplier);
            const voiceMetric = new EnergyMetrics(voiceData);
            await voiceMetric.save();
            console.log(`Inserted voice stream data for day -${i}, timestamp: ${moment(timestamp).utc().format('YYYY-MM-DD HH:mm:ss')} UTC`);
        }

        // Print summary
        const allData = await EnergyMetrics.find({
            container: "conversation-orchestrator"
        }).lean().sort({ timestamp: -1 });

        console.log('\nData Summary:');
        console.log('Total documents:', allData.length);

        // Show sample documents
        if (allData.length > 0) {
            console.log('\nSample Chat Document:');
            const chatSample = allData.find(doc => doc.apiName === "chat");
            if (chatSample) {
                console.log(JSON.stringify({
                    timestamp: moment(chatSample.timestamp).utc().format(),
                    container: chatSample.container,
                    namespace: chatSample.namespace,
                    apiName: chatSample.apiName,
                    methodName: chatSample.methodName,
                    totalEnergy_J: chatSample.totalEnergy_J,
                    path: chatSample.path,
                    trace: chatSample.trace.map(t => ({
                        container: t.container,
                        apiName: t.apiName,
                        methodName: t.methodName,
                        path: t.path,
                        totalEnergy_J: t.totalEnergy_J
                    }))
                }, null, 2));
            }

            console.log('\nSample Chat Stream Document:');
            const chatStreamSample = allData.find(doc => doc.apiName === "chat-stream");
            if (chatStreamSample) {
                console.log(JSON.stringify({
                    timestamp: moment(chatStreamSample.timestamp).utc().format(),
                    container: chatStreamSample.container,
                    namespace: chatStreamSample.namespace,
                    apiName: chatStreamSample.apiName,
                    methodName: chatStreamSample.methodName,
                    totalEnergy_J: chatStreamSample.totalEnergy_J,
                    path: chatStreamSample.path,
                    trace: chatStreamSample.trace.map(t => ({
                        container: t.container,
                        apiName: t.apiName,
                        methodName: t.methodName,
                        path: t.path,
                        totalEnergy_J: t.totalEnergy_J
                    }))
                }, null, 2));
            }

            console.log('\nSample Voice Stream Document:');
            const voiceSample = allData.find(doc => doc.apiName === "voice-stream");
            if (voiceSample) {
                console.log(JSON.stringify({
                    timestamp: moment(voiceSample.timestamp).utc().format(),
                    container: voiceSample.container,
                    namespace: voiceSample.namespace,
                    apiName: voiceSample.apiName,
                    methodName: voiceSample.methodName,
                    totalEnergy_J: voiceSample.totalEnergy_J,
                    path: voiceSample.path,
                    trace: voiceSample.trace.map(t => ({
                        container: t.container,
                        apiName: t.apiName,
                        methodName: t.methodName,
                        path: t.path,
                        totalEnergy_J: t.totalEnergy_J
                    }))
                }, null, 2));
            }
        }

        console.log('\nAll test data inserted successfully');

    } catch (error) {
        console.error('Error inserting test data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

insertOrchestratorData(); 