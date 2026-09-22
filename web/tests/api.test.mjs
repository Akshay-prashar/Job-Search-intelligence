// Comprehensive automated test runner for Web API routes using native fetch (Node.js 20+)
const BASE_URL = 'http://localhost:3000';
let authCookie = '';
let adminCookie = '';
let testUserId = '';
let testJobId = '';
let testCompanyId = '';
let testAppId = '';

const results = { passed: 0, failed: 0, errors: [] };

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    results.failed++;
    results.errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(message || `Expected ${expected}, got ${actual}`);
}

function extractTokenCookie(setCookieHeader) {
  if (!setCookieHeader) return '';
  const match = setCookieHeader.match(/token=[^;]+/i);
  return match ? `${match[0]};` : `${setCookieHeader.split(';')[0]};`;
}

async function runTests() {
  console.log('Starting Next.js Frontend API Test Suite...\n');

  // 1. Auth Tests
  console.log('--- Auth Tests ---');
  await test('register with missing fields returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' })
    });
    assertEqual(res.status, 400);
  });

  await test('register with invalid email returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email', password: 'Password123!', name: 'Test User' })
    });
    assertEqual(res.status, 400);
  });

  await test('login with wrong password returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@jobintel.com', password: 'IncorrectPassword' })
    });
    assertEqual(res.status, 401);
  });

  await test('login with non-existent email returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user@jobintel.com', password: 'Password123!' })
    });
    assertEqual(res.status, 401);
  });

  await test('login with valid demo credentials returns 200 + user object + sets cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@jobintel.com', password: 'DemoPassword123' })
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(data.user?.id || data.id, 'Missing user id');

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie, 'Missing set-cookie header');
    authCookie = extractTokenCookie(setCookie);
    assert(authCookie.includes('token='), 'Cookie does not contain token');
  });

  await test('login with admin credentials returns 200 + role=admin', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@jobintel.com', password: 'AdminPassword123' })
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assertEqual(data.user?.role, 'admin');

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie, 'Missing set-cookie header');
    adminCookie = extractTokenCookie(setCookie);
    assert(adminCookie.includes('token='), 'Cookie does not contain admin token');
  });

  await test('logout clears token cookie via DELETE', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'DELETE' });
    assertEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && (setCookie.includes('Max-Age=0') || setCookie.includes('token=;')), 'Cookie not cleared');
  });

  // Re-login as demo user for subsequent authenticated user tests
  await test('re-authenticate demo user for session continuity', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@jobintel.com', password: 'DemoPassword123' })
    });
    assertEqual(res.status, 200);
    authCookie = extractTokenCookie(res.headers.get('set-cookie'));
  });

  // 2. User Profile Tests
  console.log('\n--- User Profile Tests ---');
  await test('GET /api/users/me without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/users/me`);
    assertEqual(res.status, 401);
  });

  await test('GET /api/users/me with auth returns user profile', async () => {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(data.user?.id, 'Missing user.id');
    assert(data.user?.email, 'Missing user.email');
    assert(data.user?.name, 'Missing user.name');
    testUserId = data.user.id;
  });

  await test('PUT /api/users/me updates profile fields', async () => {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        headline: 'Full Stack Engineer & Open Source Contributor',
        preferredWorkMode: 'remote'
      })
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assertEqual(data.user?.preferredWorkMode, 'remote');
  });

  // 3. Jobs Tests
  console.log('\n--- Jobs Tests ---');
  await test('GET /api/jobs returns paginated active jobs', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?page=1&limit=5`);
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.jobs), 'Expected jobs to be an array');
    assert(data.total !== undefined, 'Missing total jobs count');
    assert(data.page === 1, 'Page should be 1');

    if (data.jobs.length > 0) {
      testJobId = data.jobs[0].id;
      if (data.jobs[0].companyId) testCompanyId = data.jobs[0].companyId;
      else if (data.jobs[0].company?.id) testCompanyId = data.jobs[0].company.id;
    }
  });

  await test('GET /api/jobs?search=engineer filters results', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?search=engineer`);
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.jobs), 'Expected filtered jobs array');
  });

  await test('GET /api/jobs/[id] with valid ID returns full job details', async () => {
    if (!testJobId) throw new Error('No testJobId available from list query');
    const res = await fetch(`${BASE_URL}/api/jobs/${testJobId}`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(data.job?.id === testJobId, 'Job ID mismatch');
    assert(data.job?.company, 'Job company missing');
    assert(data.job?.matchBreakdown, 'Research match breakdown missing');
  });

  await test('GET /api/jobs/[id] with non-existent UUID returns 404', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/00000000-0000-0000-0000-000000000000`);
    assertEqual(res.status, 404);
  });

  // 4. Job Recommendations Tests
  console.log('\n--- Job Recommendations Tests ---');
  await test('GET /api/jobs/recommendations without auth returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/recommendations`);
    assertEqual(res.status, 401);
  });

  await test('GET /api/jobs/recommendations with auth returns research-ranked jobs', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/recommendations`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.jobs), 'Expected jobs recommendations array');
    assert(data.pagination, 'Missing pagination metadata');

    if (data.jobs.length > 0) {
      const first = data.jobs[0];
      assert(first.match, 'Missing match object on recommendation');
      assert(first.match.score !== undefined, 'Missing match.score');
      assert(Array.isArray(first.match.matched_skills), 'Missing matched_skills array');
      assert(Array.isArray(first.match.missing_skills), 'Missing missing_skills array');
      assert(Array.isArray(first.match.taxonomy_matches), 'Missing taxonomy_matches array');
      assert(Array.isArray(first.match.strengths), 'Missing evidence-grounded strengths array');
    }
  });

  await test('recommendations are sorted by match score descending', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/recommendations`, {
      headers: { 'Cookie': authCookie }
    });
    const data = await res.json();
    if (data.jobs?.length > 1) {
      assert(data.jobs[0].match.score >= data.jobs[1].match.score, 'Recommendations not sorted descending');
    }
  });

  // 5. Saved Jobs Tests
  console.log('\n--- Saved Jobs Tests ---');
  await test('POST /api/jobs/[id]/save saves a job', async () => {
    if (!testJobId) throw new Error('No testJobId available');
    const res = await fetch(`${BASE_URL}/api/jobs/${testJobId}/save`, {
      method: 'POST',
      headers: { 'Cookie': authCookie }
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const data = await res.json();
    assert(data.saved !== undefined, 'Missing saved boolean');
  });

  await test('GET /api/saved-jobs returns saved jobs list', async () => {
    const res = await fetch(`${BASE_URL}/api/saved-jobs`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.savedJobs), 'savedJobs should be an array');
  });

  await test('POST /api/jobs/[id]/save toggles unsave', async () => {
    if (!testJobId) throw new Error('No testJobId available');
    const res = await fetch(`${BASE_URL}/api/jobs/${testJobId}/save`, {
      method: 'POST',
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assertEqual(data.saved, false, 'Expected job to be unsaved');
  });

  // 6. Applications Tests
  console.log('\n--- Applications Tests ---');
  await test('POST /api/applications records a job application', async () => {
    if (!testJobId) throw new Error('No testJobId available');
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobId: testJobId, status: 'applied', notes: 'Automated test application' })
    });
    // Can be 201 (created) or 409 (if previously applied)
    assert(res.status === 201 || res.status === 409 || res.status === 200, `Unexpected status ${res.status}`);
    if (res.status === 201) {
      const data = await res.json();
      testAppId = data.application?.id;
    }
  });

  await test('GET /api/applications returns user application history', async () => {
    const res = await fetch(`${BASE_URL}/api/applications`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.applications), 'applications should be an array');
    if (data.applications.length > 0 && !testAppId) {
      testAppId = data.applications[0].id;
    }
  });

  await test('PATCH /api/applications/[id] updates application status', async () => {
    if (!testAppId) return; // skip if no application created
    const res = await fetch(`${BASE_URL}/api/applications/${testAppId}`, {
      method: 'PATCH',
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'interviewing', notes: 'Scheduled round 1' })
    });
    assertEqual(res.status, 200);
  });

  // 7. Companies Tests
  console.log('\n--- Companies Tests ---');
  await test('GET /api/companies/[id] returns company details', async () => {
    if (!testCompanyId) return;
    const res = await fetch(`${BASE_URL}/api/companies/${testCompanyId}`);
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(data.company?.companyName, 'Missing companyName');
  });

  await test('GET /api/companies/[id]/interviews returns curated interview questions', async () => {
    if (!testCompanyId) return;
    const res = await fetch(`${BASE_URL}/api/companies/${testCompanyId}/interviews`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.questions), 'questions should be an array');
  });

  await test('GET /api/companies/[id]/insights returns hiring notes & insights', async () => {
    if (!testCompanyId) return;
    const res = await fetch(`${BASE_URL}/api/companies/${testCompanyId}/insights`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.insights), 'insights should be an array');
    assert(Array.isArray(data.hiringNotes), 'hiringNotes should be an array');
  });

  // 8. Admin Tests
  console.log('\n--- Admin Tests ---');
  await test('GET /api/admin/stats without auth returns 403', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`);
    assertEqual(res.status, 403);
  });

  await test('GET /api/admin/stats with non-admin user returns 403', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 403);
  });

  await test('GET /api/admin/stats with admin auth returns research stats', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Cookie': adminCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(data.stats, 'Missing stats object');
    assert(data.stats.totalTaxonomyTerms !== undefined, 'Missing totalTaxonomyTerms');
    assert(data.stats.totalJobTaxonomyLinks !== undefined, 'Missing totalJobTaxonomyLinks');
    assert(data.stats.totalMatchesComputed !== undefined, 'Missing totalMatchesComputed');
  });

  await test('POST /api/admin/ingestion triggers ingestion pipeline', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/ingestion`, {
      method: 'POST',
      headers: { 'Cookie': adminCookie }
    });
    assert(res.status === 200 || res.status === 202, `Unexpected status: ${res.status}`);
  });

  await test('GET /api/admin/companies returns company directory', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/companies`, {
      headers: { 'Cookie': adminCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.companies), 'companies should be an array');
  });

  await test('POST /api/admin/companies creates/upserts company', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/companies`, {
      method: 'POST',
      headers: {
        'Cookie': adminCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        companyName: 'Test Benchmark Corp',
        domain: 'testbenchmark.io',
        industry: 'Software',
        companySize: '50-200',
        fresherFriendly: true
      })
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assertEqual(data.company?.companyName, 'Test Benchmark Corp');
  });

  await test('GET /api/admin/sources returns active source feeds', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/sources`, {
      headers: { 'Cookie': adminCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.sources), 'sources should be an array');
  });

  // 9. Resumes, Notifications, Privacy, Skills Gap
  console.log('\n--- Resumes, Notifications, Privacy & Gap Tests ---');
  await test('GET /api/resumes/me returns resume or null', async () => {
    const res = await fetch(`${BASE_URL}/api/resumes/me`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
  });

  await test('GET /api/notifications returns notification center feed', async () => {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.notifications), 'notifications should be an array');
  });

  await test('POST /api/privacy/export exports complete user data', async () => {
    const res = await fetch(`${BASE_URL}/api/privacy/export`, {
      method: 'POST',
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(data.export_version === '1.0', 'Invalid export_version');
    assert(data.user?.id, 'Missing exported user');
  });

  await test('GET /api/skills/gap returns skills gap analysis', async () => {
    const res = await fetch(`${BASE_URL}/api/skills/gap`, {
      headers: { 'Cookie': authCookie }
    });
    assertEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.gaps), 'gaps should be an array');
  });

  // 10. Edge Cases & Security
  console.log('\n--- Edge Cases & Security Tests ---');
  await test('SQL injection in query params does not crash server', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?limit=1;DROP TABLE users;--`);
    assert(res.status === 200 || res.status === 400, 'Should handle cleanly');
  });

  await test('XSS script tags in application notes are sanitized/handled safely', async () => {
    if (!testJobId) return;
    const res = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId: testJobId,
        notes: '<script>alert("xss")</script><img src=x onerror=alert(1)>'
      })
    });
    assert(res.status !== 500, 'Server crashed on XSS string payload');
  });

  await test('Very long strings in login payload handled safely', async () => {
    const longString = 'A'.repeat(5000) + '@example.com';
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: longString, password: 'password123' })
    });
    assert(res.status === 400 || res.status === 401, 'Should reject with 400/401');
  });

  await test('Invalid JSON syntax returns 400 or 500 error cleanly without crash', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json'
    });
    assert(res.status >= 400, 'Expected 4xx/500 error for invalid json');
  });

  await test('Unsupported HTTP methods on routes return 405 Method Not Allowed', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    assertEqual(res.status, 405);
  });

  await test('Rapid concurrent API requests complete without dropped connections', async () => {
    const promises = Array.from({ length: 15 }, () => fetch(`${BASE_URL}/api/jobs?limit=2`));
    const responses = await Promise.all(promises);
    assert(responses.every(r => r.status === 200), 'Some concurrent requests failed');
  });

  // Final Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  TOTAL TESTS: ${results.passed + results.failed}`);
  console.log(`  PASSED:      ${results.passed}`);
  console.log(`  FAILED:      ${results.failed}`);
  if (results.errors.length) {
    console.log('\n  Failed Tests:');
    results.errors.forEach(e => console.log(`    ❌ ${e.name}: ${e.error}`));
  }
  console.log('═══════════════════════════════════════════════\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
