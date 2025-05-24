const EnergyMetrics = require('../models/EnergyMetrics');
const moment = require('moment');

const getTimeFrameFilter = (timeFrame) => {
    const now = moment().utc().startOf('day');
    let filter = {};

    switch (timeFrame) {
        case 'weekly':
            filter = {
                $gte: moment(now).subtract(7, 'days').startOf('day').toDate(),
                $lte: moment(now).endOf('day').toDate()
            };
            break;
        case 'monthly':
            filter = {
                $gte: moment(now).subtract(30, 'days').startOf('day').toDate(),
                $lte: moment(now).endOf('day').toDate()
            };
            break;
        case 'yearly':
            filter = {
                $gte: moment(now).subtract(365, 'days').startOf('day').toDate(),
                $lte: moment(now).endOf('day').toDate()
            };
            break;
        default:
            filter = {
                $gte: moment(now).subtract(7, 'days').startOf('day').toDate(),
                $lte: moment(now).endOf('day').toDate()
            };
    }
    return filter;
};

const calculateTrend = async (namespace, container) => {
    const trend = [];
    const now = moment().utc().startOf('day');

    for (let i = 6; i >= 0; i--) {
        const dayStart = moment(now).subtract(i, 'days').startOf('day');
        const dayEnd = moment(dayStart).endOf('day');

        console.log(`Querying for day -${i}:`, {
            start: dayStart.format(),
            end: dayEnd.format()
        });

        const dayMetrics = await EnergyMetrics.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: dayStart.toDate(),
                        $lte: dayEnd.toDate()
                    },
                    namespace: namespace,
                    container: container
                }
            },
            {
                $group: {
                    _id: null,
                    totalEnergy: { $sum: '$totalEnergy_J' }
                }
            }
        ]);

        console.log(`Results for day -${i}:`, dayMetrics);
        trend.push(dayMetrics[0]?.totalEnergy || 0);
    }

    return trend;
};

exports.getEnergyMetrics = async (req, res) => {
    try {
        const { time_frame, namespace, containername } = req.body;
        const timeFilter = getTimeFrameFilter(time_frame);

        console.log('Query Parameters:', {
            time_frame,
            namespace,
            containername,
            timeFilter: {
                start: moment(timeFilter.$gte).format(),
                end: moment(timeFilter.$lte).format()
            }
        });

        const metrics = await EnergyMetrics.find({
            namespace: namespace,
            container: containername
        }).lean();

        console.log('Basic Query Filter:', {
            timestamp: {
                $gte: timeFilter.$gte,
                $lte: timeFilter.$lte
            },
            namespace,
            container: containername
        });

        console.log('Found records count:', metrics.length);
        console.log('Sample record:', metrics[0]);

        if (metrics.length === 0) {
            const allRecords = await EnergyMetrics.find({}).limit(1).lean();
            console.log('Sample from all records:', allRecords[0]);

            const distinctNamespaces = await EnergyMetrics.distinct('namespace');
            const distinctContainers = await EnergyMetrics.distinct('container');
            console.log('Available namespaces:', distinctNamespaces);
            console.log('Available containers:', distinctContainers);
        }

        const currentMetrics = await EnergyMetrics.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: timeFilter.$gte,
                        $lte: timeFilter.$lte
                    },
                    namespace: namespace,
                    container: containername
                }
            },
            {
                $group: {
                    _id: null,
                    total_energy: { $sum: '$totalEnergy_J' },
                    avg_execution_time: { $avg: '$total_executionTime_MS' },
                    memory_used: { $sum: '$memoryUsed_MB' },
                    cpu_energy: { $sum: '$cpuEnergy_J' },
                    ram_energy: { $sum: '$ramEnergy_J' }
                }
            }
        ]);

        const previousTimeFilter = {
            $gte: moment(timeFilter.$gte).subtract(7, 'days').toDate(),
            $lte: moment(timeFilter.$lte).subtract(7, 'days').toDate()
        };

        const previousMetrics = await EnergyMetrics.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: previousTimeFilter.$gte,
                        $lte: previousTimeFilter.$lte
                    },
                    namespace: namespace,
                    container: containername
                }
            },
            {
                $group: {
                    _id: null,
                    total_energy: { $sum: '$totalEnergy_J' }
                }
            }
        ]);

        const currentEnergy = currentMetrics[0]?.total_energy || 0;
        const previousEnergy = previousMetrics[0]?.total_energy || 0;
        const comparison = previousEnergy === 0 ? 0 :
            ((currentEnergy - previousEnergy) / previousEnergy) * 100;

        const trend = await calculateTrend(namespace, containername);

        const response = {
            total_energy: Math.round(currentMetrics[0]?.total_energy || 0),
            cpu_energy: Math.round(currentMetrics[0]?.cpu_energy || 0),
            ram_energy: Math.round(currentMetrics[0]?.ram_energy || 0),
            avg_execution_time: Math.round(currentMetrics[0]?.avg_execution_time || 0),
            memory_used: Math.round((currentMetrics[0]?.memory_used || 0) * 100) / 100,
            last_week_trend: trend.map(val => Math.round(val * 100) / 100),
            comparison: Math.round(comparison * 100) / 100,
            record_count: metrics.length
        };

        res.json(response);

    } catch (error) {
        console.error('Error calculating energy metrics:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};

exports.getFilteredMetrics = async (req, res) => {
    try {
        const { namespace, containername, startDate, endDate } = req.body;

        const timeFilter = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };

        const metrics = await EnergyMetrics.find({
            timestamp: {
                $gte: timeFilter.$gte,
                $lte: timeFilter.$lte
            },
            namespace: namespace,
            container: containername
        }).sort({ timestamp: -1 });

        console.log('Found records:', metrics.length);

        res.json({
            count: metrics.length,
            records: metrics
        });

    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPerformanceStats = async (req, res) => {
    try {
        const { namespace, containername, time_frame } = req.body;
        const timeFilter = getTimeFrameFilter(time_frame || 'weekly'); // Use provided time_frame or default to weekly

        // Get all APIs for the container
        const containerMetrics = await EnergyMetrics.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: timeFilter.$gte,
                        $lte: timeFilter.$lte
                    },
                    namespace: namespace,
                    container: containername
                }
            },
            {
                $group: {
                    _id: '$apiName',
                    energy: { $sum: '$totalEnergy_J' },
                    avg_time: { $avg: '$total_executionTime_MS' },
                    memory_used: { $avg: '$memoryUsed_MB' },
                    co2_emission: { $sum: { $multiply: ['$totalEnergy_J', 0.233] } }, // Rough CO2 conversion
                    dependents: { $push: '$trace' },
                    method: { $first: '$methodName' } // Include the HTTP method
                }
            }
        ]);

        // Calculate total energy
        const totalEnergy = containerMetrics.reduce((sum, api) => sum + api.energy, 0);

        // Process each API's data
        const apis = {};
        for (const api of containerMetrics) {
            const apiName = api._id || 'unknown';
            
            // Process dependents
            const dependents = [];
            const uniqueDependents = new Set();
            
            api.dependents.forEach(trace => {
                trace.forEach(dep => {
                    const depKey = `${dep.container}-${dep.apiName}`;
                    if (!uniqueDependents.has(depKey)) {
                        uniqueDependents.add(depKey);
                        dependents.push({
                            service: dep.container,
                            type: dep.methodName || 'GET', // Use actual method from trace
                            co2: Math.round(dep.totalEnergy_J * 0.233 * 100) / 100,
                            energy: Math.round(dep.totalEnergy_J * 100) / 100
                        });
                    }
                });
            });

            // Generate performance trends (last 8 days)
            const perfTrends = [];
            for (let i = 7; i >= 0; i--) {
                const dayStart = moment(timeFilter.$gte).add(i, 'days').startOf('day');
                const dayEnd = moment(dayStart).endOf('day');
                
                const dayMetrics = await EnergyMetrics.aggregate([
                    {
                        $match: {
                            timestamp: {
                                $gte: dayStart.toDate(),
                                $lte: dayEnd.toDate()
                            },
                            namespace: namespace,
                            container: containername,
                            apiName: apiName
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalEnergy: { $sum: '$totalEnergy_J' }
                        }
                    }
                ]);
                
                perfTrends.push(Math.round((dayMetrics[0]?.totalEnergy || 0) * 100) / 100);
            }

            // Generate suggestions based on metrics
            const suggestions = [];
            if (api.avg_time > 1000) suggestions.push("Consider optimizing API response time");
            if (api.memory_used > 100) suggestions.push("High memory usage detected, consider memory optimization");
            if (api.energy > 1000) suggestions.push("High energy consumption detected, consider code optimization");
            if (dependents.length > 5) suggestions.push("Large number of dependencies, consider service consolidation");
            if (api.co2_emission > 100) suggestions.push("High CO2 emissions detected, consider green computing practices");
            
            // Add default suggestions if we don't have enough
            while (suggestions.length < 5) {
                suggestions.push("Monitor API performance regularly");
            }

            apis[apiName] = {
                energy: Math.round(api.energy * 100) / 100,
                avg_time: Math.round(api.avg_time * 100) / 100,
                co2_emission: Math.round(api.co2_emission * 100) / 100,
                memory_used: Math.round(api.memory_used * 100) / 100,
                method: api.method, // Include the HTTP method in response
                details: {
                    suggestions: suggestions.slice(0, 5),
                    perf_trends: perfTrends,
                    dependents: dependents
                }
            };
        }

        const response = {
            total_energy: Math.round(totalEnergy * 100) / 100,
            time_frame: time_frame || 'weekly',
            apis: apis
        };

        res.json(response);

    } catch (error) {
        console.error('Error calculating performance stats:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
