const fs = require('fs');

function generateMetrics() {
  const cpuTime = Math.random() * (1500 - 500) + 500;
  const memoryUsed = Math.random() * (16 - 4) + 4;
  const cpuEnergy = cpuTime * 0.67;
  const ramEnergy = memoryUsed * 0.00025;
  const totalEnergy = cpuEnergy + ramEnergy;
  const totalExecTime = cpuTime * (Math.random() * (2.5 - 1.5) + 1.5);
  return { totalExecTime, cpuTime, memoryUsed, cpuEnergy, ramEnergy, totalEnergy };
}

function generateObjectId() {
  return Math.random().toString(16).slice(2, 26).padEnd(24, '0');
}

let records = [];
let startDate = new Date('2025-05-01T00:00:00.000Z');

for (let i = 0; i < 24; i++) {
  let currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + i);

  let timestamp = currentDate.toISOString();
  let mainMetrics = generateMetrics();

  let trace = [];
  let traceContainers, tracePaths;

  if (i % 2 === 0) {
    traceContainers = ['skills-loan'];
    tracePaths = ['/bawaba/loans/v1'];
  } else {
    traceContainers = ['skills-financial', 'skills-account'];
    tracePaths = ['/bawaba/loans/v1', '/customers/v1'];
  }

  for (let j = 0; j < traceContainers.length; j++) {
    let traceMetrics = generateMetrics();
    trace.push({
      _id: { $oid: generateObjectId() },
      container: traceContainers[j],
      namespace: 'contactcenterservices',
      path: tracePaths[j],
      total_executionTime_MS: traceMetrics.totalExecTime,
      cpuTime_MS: traceMetrics.cpuTime,
      memoryUsed_MB: traceMetrics.memoryUsed,
      cpuEnergy_J: traceMetrics.cpuEnergy,
      ramEnergy_J: traceMetrics.ramEnergy,
      totalEnergy_J: traceMetrics.totalEnergy
    });
  }

  records.push({
    _id: { $oid: generateObjectId() },
    timestamp: { $date: timestamp },
    container: 'conversation-orchestrator',
    namespace: 'contactcenterservices',
    total_executionTime_MS: mainMetrics.totalExecTime,
    cpuTime_MS: mainMetrics.cpuTime,
    memoryUsed_MB: mainMetrics.memoryUsed,
    cpuEnergy_J: mainMetrics.cpuEnergy,
    ramEnergy_J: mainMetrics.ramEnergy,
    totalEnergy_J: mainMetrics.totalEnergy,
    path: '/chat/api/v1',
    trace: trace,
    __v: 0
  });
}

// Write to file
fs.writeFileSync('mongo_docs.json', JSON.stringify(records, null, 2));
console.log('Generated mongo_docs.json with 24 records.');
