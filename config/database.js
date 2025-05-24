module.exports = {
    mongodb: {
        url:  'mongodb+srv://aravindpiratla94:N2VkfyWFFBJawnX0@my-cluster.hlszoqk.mongodb.net/energy-metrics',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 50,
            minPoolSize: 10,
            maxIdleTimeMS: 30000,
            compressors: ['zlib'],
            retryWrites: true,
            writeConcern: {
                w: 'majority',
                j: true,
                wtimeout: 1000
            },
            readPreference: 'primary',
            readConcern: { level: 'majority' }
        }
    }
}; 

//N2VkfyWFFBJawnX0