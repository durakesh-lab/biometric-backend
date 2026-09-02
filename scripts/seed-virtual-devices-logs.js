const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.mongodb_cluster_url || 'mongodb://localhost:27017/biometric';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully!');

  const db = mongoose.connection.db;

  // 1. Find target employee with deviceUserId = "3"
  const employeesCol = db.collection('employees');
  const employee = await employeesCol.findOne({ deviceUserId: '3' });

  if (!employee) {
    console.error('Error: Could not find employee with deviceUserId = "3"');
    process.exit(1);
  }
  console.log(`Found Employee: ${employee.firstName} ${employee.lastName} (ID: ${employee._id})`);

  // 2. Find company "Z Techno PVT LTD" and its branch
  const companiesCol = db.collection('companies');
  const branchesCol = db.collection('branches');
  const company = await companiesCol.findOne({ name: /Z Techno/i });
  const companyIdStr = company ? String(company._id) : String(employee.companyId || '');
  const companyIdProp = company ? company.companyId || company._id : employee.companyId;

  let branch = null;
  if (company) {
    branch = await branchesCol.findOne({ companyId: companyIdStr }) || await branchesCol.findOne({ companyId: company._id });
  }
  const branchIdStr = branch ? String(branch._id) : String(employee.branchId || '');

  console.log(`Using Company ID: ${companyIdStr}, Branch ID: ${branchIdStr}`);

  // 3. Define 5 Virtual Devices
  const virtualDevicesData = [
    { name: 'ZKTeco F09 Terminal 1', serialNumber: 'VIRT-F01-001', location: 'Floor 1 - Main Entrance' },
    { name: 'ZKTeco F09 Terminal 2', serialNumber: 'VIRT-F02-002', location: 'Floor 2 - Server Room' },
    { name: 'ZKTeco K45 Terminal 3', serialNumber: 'VIRT-F03-003', location: 'Floor 3 - HR Block' },
    { name: 'ZKTeco F09 Terminal 4', serialNumber: 'VIRT-F04-004', location: 'Floor 4 - Executive Gate' },
    { name: 'ZKTeco F09 Terminal 5', serialNumber: 'VIRT-F05-005', location: 'Floor 5 - Cafeteria' },
  ];

  const devicesCol = db.collection('devices');
  const createdDeviceIds = [];

  for (const dev of virtualDevicesData) {
    const existing = await devicesCol.findOne({ serialNumber: dev.serialNumber });
    let devId;
    if (existing) {
      devId = existing._id;
      await devicesCol.updateOne(
        { _id: devId },
        { $set: { name: dev.name, location: dev.location, companyId: companyIdStr, branchId: branchIdStr } }
      );
      console.log(`Updated virtual device "${dev.name}" (${devId})`);
    } else {
      const result = await devicesCol.insertOne({
        name: dev.name,
        serialNumber: dev.serialNumber,
        status: 'Online',
        location: dev.location,
        companyId: companyIdStr,
        branchId: branchIdStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      devId = result.insertedId;
      console.log(`Created virtual device "${dev.name}" (${devId})`);
    }
    createdDeviceIds.push(devId);
  }

  // 4. Update employee deviceLinks with all 5 virtual device IDs (plus any existing links)
  const existingLinks = employee.deviceLinks || [];
  const existingLinkIds = new Set(existingLinks.map(l => String(l.deviceId)));
  
  const updatedLinks = [...existingLinks];
  for (const devId of createdDeviceIds) {
    const strId = String(devId);
    if (!existingLinkIds.has(strId)) {
      updatedLinks.push({ deviceId: strId });
      existingLinkIds.add(strId);
    }
  }

  await employeesCol.updateOne(
    { _id: employee._id },
    { $set: { deviceLinks: updatedLinks, deviceUserId: '3' } }
  );
  console.log(`Updated employee ${employee.firstName} with ${updatedLinks.length} device links!`);

  // 5. Create realistic attendance punch logs for deviceUserId = "3" today
  const attendancesCol = db.collection('attendances');
  const today = new Date();
  
  const sampleTimes = [
    { hour: 8, min: 30, devIndex: 0, type: 'In' },   // Floor 1 Main Entrance
    { hour: 10, min: 15, devIndex: 1, type: 'In' },  // Floor 2 Server Room
    { hour: 12, min: 45, devIndex: 4, type: 'In' },  // Floor 5 Cafeteria
    { hour: 15, min: 20, devIndex: 2, type: 'In' },  // Floor 3 HR Block
    { hour: 17, min: 50, devIndex: 3, type: 'Out' }, // Floor 4 Executive Gate
  ];

  let addedPunches = 0;
  for (const punch of sampleTimes) {
    const ts = new Date(today.getFullYear(), today.getMonth(), today.getDate(), punch.hour, punch.min, 0);
    const devId = createdDeviceIds[punch.devIndex];

    const dup = await attendancesCol.findOne({
      deviceUserId: '3',
      deviceId: String(devId),
      timestamp: ts,
    });

    if (!dup) {
      await attendancesCol.insertOne({
        employeeId: String(employee._id),
        deviceUserId: '3',
        timestamp: ts,
        deviceId: String(devId),
        companyId: companyIdStr,
        branchId: branchIdStr,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addedPunches++;
    }
  }

  console.log(`Inserted ${addedPunches} attendance punch logs for deviceUserId = "3" across virtual devices!`);
  console.log('Seeding complete successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});
