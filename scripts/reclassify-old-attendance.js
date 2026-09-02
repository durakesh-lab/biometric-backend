const mongoose = require('mongoose');

async function reclassify() {
  const uri = process.env.mongodb_cluster_url || 'mongodb://localhost:27017/biometric';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);

  const attendanceSchema = new mongoose.Schema({}, { strict: false });
  const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendances');

  // Fetch all attendance records sorted by timestamp ascending
  const records = await Attendance.find({}).sort({ timestamp: 1 });
  console.log(`Found ${records.length} total attendance records in database.`);

  // Group records by employeeId and date string (YYYY-MM-DD)
  const grouped = {};
  for (const r of records) {
    if (!r.employeeId || !r.timestamp) continue;
    const d = new Date(r.timestamp);
    const dateStr = d.toISOString().slice(0, 10);
    const key = `${r.employeeId}_${dateStr}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  let updatedCount = 0;
  for (const key of Object.keys(grouped)) {
    const dayRecords = grouped[key];
    // First record of the day is 'in', rest are 'out'
    for (let i = 0; i < dayRecords.length; i++) {
      const rec = dayRecords[i];
      const correctType = i === 0 ? 'in' : 'out';
      if (rec.type !== correctType) {
        rec.type = correctType;
        await rec.save();
        updatedCount++;
      }
    }
  }

  console.log(`Successfully re-classified ${updatedCount} attendance records!`);
  await mongoose.disconnect();
}

reclassify();
