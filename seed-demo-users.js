/**
 * seed-demo-users.js  —  creates the other roles the PROPER way (via the real API).
 * ------------------------------------------------------------------
 * Unlike seed-superadmin.js (which writes to the DB), this script uses the
 * actual HTTP flow a real admin would use:
 *     1. POST /auth/login           as the seeded Super Admin → get token
 *     2. POST /auth/admin/create-user  (Bearer token) for each role
 *
 * So it both seeds demo users AND proves the admin-create flow works.
 *
 * PREREQUISITES:
 *   - Backend running on BASE_URL (default http://localhost:3001)
 *   - Super Admin already seeded:  node seed-superadmin.js
 *
 * Run from the microservice-biomatric folder:
 *     node seed-demo-users.js
 * ------------------------------------------------------------------
 */
require('dotenv').config();

const BASE_URL = process.env.SEED_BASE_URL || 'http://localhost:3001';
const SUPER_ADMIN = { username: 'superadmin@biometric.test', password: 'Admin@123' };

// The roles that SHOULD be created via the admin API (NOT seeded directly).
const DEMO_USERS = [
  { role: 'HR Admin',  username: 'hradmin@biometric.test',  firstName: 'HR',    lastName: 'Admin',    password: 'Hr@12345' },
  { role: 'Manager',   username: 'manager@biometric.test',  firstName: 'Mike',  lastName: 'Manager',  password: 'Manager@123' },
  { role: 'Employee',  username: 'employee@biometric.test', firstName: 'Emma',  lastName: 'Employee', password: 'Employee@123' },
  { role: 'Guest',     username: 'guest@biometric.test',    firstName: 'Guest', lastName: 'User',     password: 'Guest@123' },
];

// Node 18+ has global fetch.
async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

function decodeJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

async function main() {
  // 1) Log in as Super Admin → token (+ org context from the token payload).
  const login = await api('/auth/login', { method: 'POST', body: SUPER_ADMIN });
  const token = login.json && login.json.access_token;
  if (!token) {
    console.error('❌ Could not log in as Super Admin. Run `node seed-superadmin.js` first and make sure the backend is running.');
    console.error('   Response:', login.status, login.json);
    process.exit(1);
  }
  const me = decodeJwt(token);
  console.log(`✅ Logged in as Super Admin (companyId=${me.companyId}, branchId=${me.branchId})`);

  // 2) Create each role via the admin route (scoped to the Super Admin's org).
  for (const u of DEMO_USERS) {
    const { status, json } = await api('/auth/admin/create-user', {
      method: 'POST',
      token,
      body: {
        username: u.username,
        email: u.username,
        password: u.password,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        active_status: 'Active',
        companyId: me.companyId,
        branchId: me.branchId,
        mobile: 9000000000,
        gender: 'Other',
      },
    });
    if (status === 201 || status === 200) {
      console.log(`✅ Created [${u.role}] -> ${u.username} / ${u.password}`);
    } else if (json && /already exists/i.test(JSON.stringify(json))) {
      console.log(`↺ Exists  [${u.role}] -> ${u.username} (skipped)`);
    } else {
      console.log(`⚠️ Failed  [${u.role}] -> ${u.username}: ${status} ${JSON.stringify(json)}`);
    }
  }

  console.log('\n🎉 Done (created via the real admin-token flow). Logins:');
  console.log(`   Super Admin  ${SUPER_ADMIN.username}  /  ${SUPER_ADMIN.password}   (from seed-superadmin.js)`);
  DEMO_USERS.forEach((u) => console.log(`   ${u.role.padEnd(12)} ${u.username}  /  ${u.password}`));
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed-demo-users failed:', err.message || err);
  process.exit(1);
});
