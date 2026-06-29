/**
 * seed-superadmin.js  —  the CORRECT, production bootstrap.
 * ------------------------------------------------------------------
 * Creates ONLY what cannot be created through the API:
 *   - 1 Super Admin  (no API route can create a Super Admin — DB only)
 *   - 1 Company, 1 Branch, 1 Department  (so other users can be scoped to them)
 *   - the "2factor-authentication" Setting (OFF, so login returns a token directly)
 *
 * Everything else (HR Admin, Manager, Employee, Guest) is then created the
 * PROPER way — by this Super Admin via POST /auth/admin/create-user.
 * Run `node seed-demo-users.js` to do that automatically (it calls the real API).
 *
 * Run from the microservice-biomatric folder:
 *     node seed-superadmin.js
 *
 * Idempotent: re-running updates the same records (matched by unique key).
 * ------------------------------------------------------------------
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URL = process.env.mongodb_cluster_url;

// The ONE account that must be seeded (DB is the only way to mint a Super Admin).
const SUPER_ADMIN = {
  role: 'Super Admin',
  username: 'superadmin@biometric.test',
  firstName: 'Super',
  lastName: 'Admin',
  password: 'Admin@123',
};

async function main() {
  if (!MONGO_URL) {
    console.error('❌ mongodb_cluster_url is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URL);
  console.log('✅ Connected to MongoDB');
  const db = mongoose.connection.db;

  // 1) Setting: 2FA OFF so /auth/login returns a token immediately.
  await db.collection('settings').updateOne(
    { type: '2factor-authentication' },
    { $set: { type: '2factor-authentication', datavalue: false } },
    { upsert: true },
  );
  console.log('✅ Setting "2factor-authentication" => datavalue:false');

  // Helper: upsert a doc then read it back (version-proof; avoids Mongoose-8 .value change).
  async function upsertGet(coll, filter, set) {
    await db.collection(coll).updateOne(filter, { $set: set }, { upsert: true });
    return db.collection(coll).findOne(filter);
  }

  // 2) Company / Branch / Department (so created users can be scoped to a real org).
  const company = await upsertGet('companies', { companyId: 'COMP001' }, {
    name: 'Demo Company', companyId: 'COMP001', owner: 'Owner',
    mailingAddress: '123 Demo Street', email: 'company@biometric.test',
    phoneNumber: '0000000000', branches: [],
  });
  console.log('✅ Company:', company._id.toString());

  const branch = await upsertGet('branches', { branchCode: 'BR001' }, {
    name: 'Head Office', branchCode: 'BR001', manager: 'Mike Manager',
    address: '123 Demo Street', phoneNumber: '0000000000',
    email: 'branch@biometric.test', companyId: company._id, departments: [],
  });
  console.log('✅ Branch:', branch._id.toString());

  const dept = await upsertGet('departments', { dept_code: 'DEP001' }, {
    name: 'General', dept_code: 'DEP001',
    branchId: branch._id.toString(), company_id: company._id.toString(),
  });
  console.log('✅ Department:', dept._id.toString());

  // 3) The Super Admin (bcrypt-hashed password; scoped to the demo org).
  const hashed = await bcrypt.hash(SUPER_ADMIN.password, 10);
  await db.collection('users').updateOne(
    { username: SUPER_ADMIN.username },
    {
      $set: {
        username: SUPER_ADMIN.username,
        email: SUPER_ADMIN.username,
        password: hashed,
        role: SUPER_ADMIN.role,
        firstName: SUPER_ADMIN.firstName,
        lastName: SUPER_ADMIN.lastName,
        active_status: 'Active',
        branchId: branch._id.toString(),
        companyId: company._id.toString(),
        deptId: dept._id.toString(),
        joining_date: '2024-01-01',
        date_of_birth: '1990-01-01',
        gender: 'Other',
        mobile: 9999999999,
      },
    },
    { upsert: true },
  );

  console.log('\n🎉 Super Admin ready (DB bootstrap):');
  console.log(`   ${SUPER_ADMIN.username}  /  ${SUPER_ADMIN.password}`);
  console.log('\nNext: create the other roles the proper way →  node seed-demo-users.js');
  console.log('(or POST /auth/admin/create-user with this Super Admin\'s token)');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
