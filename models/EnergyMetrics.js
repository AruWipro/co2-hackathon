const mongoose = require('mongoose');

const energyMetricsSchema = new mongoose.Schema({
    timestamp: Date,
    container: String,
    namespace: String,
    apiName: String,
    methodName: String,
    total_executionTime_MS: Number,
    cpuTime_MS: Number,
    memoryUsed_MB: Number,
    cpuEnergy_J: Number,
    ramEnergy_J: Number,
    totalEnergy_J: Number,
    path: String,
    trace: [{
        container: String,
        namespace: String,
        apiName: String,
        methodName: String,
        path: String,
        total_executionTime_MS: Number,
        cpuTime_MS: Number,
        memoryUsed_MB: Number,
        cpuEnergy_J: Number,
        ramEnergy_J: Number,
        totalEnergy_J: Number
    }]
}, {
    collection: 'energymetrics' 
});

module.exports = mongoose.model('EnergyMetrics', energyMetricsSchema); 