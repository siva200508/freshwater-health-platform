// Automated API Verification Test Suite for Freshwater Body Health Monitoring Platform
// Runs against the local running or in-memory Express server

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.TEST_URL || `http://127.0.0.1:${PORT}`;

let serverProcess = null;

function waitForServer(url, timeoutMs = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      http.get(`${url}/api/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('Server failed to respond within timeout.'));
      }
      setTimeout(tryConnect, 300);
    }
    tryConnect();
  });
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: options.headers || {}
    };

    if (postData) {
      if (typeof postData === 'object') {
        postData = JSON.stringify(postData);
        reqOptions.headers['Content-Type'] = 'application/json';
      }
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automated API Test Suite for Freshwater Platform...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns 200 and healthy status', async () => {
    const res = await request({ path: '/api/health' });
    if (res.status !== 200 || res.body.status !== 'healthy') {
      throw new Error(`Expected status 200 & healthy, got ${res.status}`);
    }
  });

  // 2. Water bodies
  let waterBodies = [];
  await test('GET /api/water-bodies returns registered water bodies', async () => {
    const res = await request({ path: '/api/water-bodies' });
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error(`Expected array of water bodies, got ${res.status}`);
    }
    waterBodies = res.body.data;
  });

  // 3. Reports
  let reports = [];
  await test('GET /api/reports returns list of pollution reports', async () => {
    const res = await request({ path: '/api/reports' });
    if (res.status !== 200 || !Array.isArray(res.body.data)) {
      throw new Error(`Expected array of reports, got ${res.status}`);
    }
    reports = res.body.data;
  });

  // 4. Citizen Login
  let citizenToken = '';
  await test('POST /api/auth/login authenticates Citizen Scientist (Priya Sharma)', async () => {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { email: 'priya@earthguard.org', password: 'CitizenPassword123!' }
    );
    if (res.status !== 200 || !res.body.token) {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.body)}`);
    }
    citizenToken = res.body.token;
  });

  // 5. Submit new report
  let createdReportId = '';
  await test('POST /api/reports submits new pollution incident', async () => {
    const res = await request(
      {
        path: '/api/reports',
        method: 'POST',
        headers: { Authorization: `Bearer ${citizenToken}` }
      },
      {
        waterBodyId: waterBodies[0].id,
        title: 'Automated Test: Chemical runoff spotted along western inlet',
        pollutionType: 'Chemical Runoff',
        severity: 'High',
        description: 'Automated test suite verification incident with yellow effluent discharge.',
        address: 'Western Culvert Inflow Point',
        waterColor: 'Turbid Yellow',
        odor: 'Chemical / Pungent',
        ph: 8.6,
        dissolvedOxygenMgL: 2.3
      }
    );
    if (res.status !== 201 || !res.body.data || !res.body.data.id) {
      throw new Error(`Report submission failed: ${res.status}`);
    }
    createdReportId = res.body.data.id;
  });

  // 6. Community Endorsement
  await test('POST /api/reports/:id/endorse adds citizen verification', async () => {
    // Login as activist David Miller
    const loginRes = await request(
      { path: '/api/auth/login', method: 'POST' },
      { email: 'david@rivercleanup.org', password: 'CitizenPassword123!' }
    );
    const davidToken = loginRes.body.token;

    const res = await request({
      path: `/api/reports/${createdReportId}/endorse`,
      method: 'POST',
      headers: { Authorization: `Bearer ${davidToken}` }
    });
    if (res.status !== 200 || !res.body.endorsements) {
      throw new Error(`Endorsement failed: ${res.status}`);
    }
  });

  // 7. Community Comment
  await test('POST /api/reports/:id/comments posts citizen update', async () => {
    const res = await request(
      {
        path: `/api/reports/${createdReportId}/comments`,
        method: 'POST',
        headers: { Authorization: `Bearer ${citizenToken}` }
      },
      { comment: 'Field test comment: Water sample dispatched to analytical laboratory.' }
    );
    if (res.status !== 201 || !res.body.data) {
      throw new Error(`Comment failed: ${res.status}`);
    }
  });

  // 8. Admin Login & Status Triage
  let adminToken = '';
  await test('POST /api/auth/login authenticates Environmental Officer Admin', async () => {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { email: 'admin@freshwaterwatch.org', password: 'AdminPassword123!' }
    );
    if (res.status !== 200 || !res.body.token || res.body.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${res.status}`);
    }
    adminToken = res.body.token;
  });

  // 9. Admin update report status
  await test('PATCH /api/reports/:id/status updates incident status to Under Investigation', async () => {
    const res = await request(
      {
        path: `/api/reports/${createdReportId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      { status: 'Under Investigation', authorityNotes: 'State PCB field inspection scheduled.' }
    );
    if (res.status !== 200 || res.body.data.status !== 'Under Investigation') {
      throw new Error(`Admin update status failed: ${res.status}`);
    }
  });

  // 10. Analytics summary
  await test('GET /api/analytics/summary returns platform metrics', async () => {
    const res = await request({ path: '/api/analytics/summary' });
    if (res.status !== 200 || !res.body.data.totalWaterBodies || !res.body.data.totalReports) {
      throw new Error(`Analytics summary failed: ${res.status}`);
    }
  });

  console.log(`\n--------------------------------------------`);
  console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`--------------------------------------------\n`);

  if (serverProcess) {
    console.log('🛑 Shutting down spawned test server...');
    serverProcess.kill();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    // Check if server is already running, otherwise spawn one
    try {
      await waitForServer(BASE_URL, 800);
      console.log('📡 Connected to existing server at ' + BASE_URL);
    } catch (e) {
      console.log('🚀 Spawning local test server instance...');
      const serverPath = path.join(__dirname, '..', 'server.js');
      serverProcess = spawn('node', [serverPath], {
        env: { ...process.env, PORT: String(PORT) },
        stdio: 'ignore'
      });
      await waitForServer(BASE_URL, 6000);
      console.log('✅ Local test server started on ' + BASE_URL);
    }

    await runTests();
  })().catch(err => {
    console.error('Test suite uncaught error:', err);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  });
}

module.exports = { runTests };
