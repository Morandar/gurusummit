import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration for 200 concurrent users
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up
    { duration: '2m', target: 50 },   // Ramp up to 50
    { duration: '3m', target: 100 },  // Ramp up to 100
    { duration: '5m', target: 150 },  // Ramp up to 150
    { duration: '5m', target: 200 },  // Peak at 200 users
    { duration: '3m', target: 200 },  // Stay at peak
    { duration: '2m', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.05'],
  },
};

// Supabase configuration
const SUPABASE_URL = 'https://jclbonbkpthbckjctyre.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key-here';

// Simulated user data
const testUsers = [];
for (let i = 1; i <= 500; i++) {
  testUsers.push({
    personalnumber: `LOADTEST${i.toString().padStart(4, '0')}`,
    firstname: `LoadTest${i}`,
    lastname: `User${i}`,
    position: 'Load Tester',
    password: 'test123456'
  });
}

export default function () {
  const userIndex = (__VU - 1) % testUsers.length;
  const user = testUsers[userIndex];

  try {
    // Simulate different user behaviors
    const behavior = Math.random();

    if (behavior < 0.4) {
      // 40% - Read operations (dashboard, booths, program)
      performReadOperations();
    } else if (behavior < 0.7) {
      // 30% - User registration/login
      performAuthOperations(user);
    } else {
      // 30% - Write operations (visits, etc.)
      performWriteOperations(user);
    }

    // Random delay to simulate real user behavior
    sleep(Math.random() * 3 + 0.5);

  } catch (error) {
    console.error(`VU ${__VU} error:`, error.message);
    errorRate.add(1);
  }
}

function performReadOperations() {
  const endpoints = [
    '/rest/v1/booths?select=*',
    '/rest/v1/program?select=*&order=time',
    '/rest/v1/banner?select=*&is_active=eq.true',
    '/rest/v1/notifications?select=*&is_active=eq.true&order=created_at.desc&limit=5'
  ];

  endpoints.forEach(endpoint => {
    const response = http.get(`${SUPABASE_URL}${endpoint}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    check(response, {
      [`${endpoint} status 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(0.1); // Small delay between requests
  });
}

function performAuthOperations(user) {
  // Try to register user (will fail if already exists, but that's ok)
  const registerPayload = {
    personalnumber: user.personalnumber,
    firstname: user.firstname,
    lastname: user.lastname,
    position: user.position,
    password_hash: '$2b$10$fake.hash.for.load.test' // Pre-hashed password
  };

  let response = http.post(`${SUPABASE_URL}/rest/v1/users`, JSON.stringify(registerPayload), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
  });

  // Check if registration succeeded or user already exists
  check(response, {
    'registration status 201 or 409': (r) => r.status === 201 || r.status === 409,
    'registration response time < 1500ms': (r) => r.timings.duration < 1500,
  }) || errorRate.add(1);
}

function performWriteOperations(user) {
  // Simulate booth visit
  // First get a random booth
  const boothResponse = http.get(`${SUPABASE_URL}/rest/v1/booths?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (boothResponse.status !== 200 || !boothResponse.json().length) {
    return;
  }

  const boothId = boothResponse.json()[0].id;

  // Get or create user ID for this test user
  const userResponse = http.get(`${SUPABASE_URL}/rest/v1/users?select=id&personalnumber=eq.${user.personalnumber}&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (userResponse.status !== 200 || !userResponse.json().length) {
    return;
  }

  const userId = userResponse.json()[0].id;

  // Try to create a visit (will fail if already exists due to unique constraint)
  const visitPayload = {
    attendee_id: userId,
    booth_id: boothId
  };

  const response = http.post(`${SUPABASE_URL}/rest/v1/visits`, JSON.stringify(visitPayload), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
  });

  check(response, {
    'visit creation status 201 or 409': (r) => r.status === 201 || r.status === 409,
    'visit creation response time < 1500ms': (r) => r.timings.duration < 1500,
  }) || errorRate.add(1);
}

export function setup() {
  console.log('🚀 Starting load test for O2 Guru Summit');
  console.log('📊 Testing with up to 200 concurrent users');
  console.log('🎯 Target: 95% of requests < 2s, error rate < 5%');

  // Verify Supabase connection
  const healthCheck = http.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (healthCheck.status !== 200) {
    console.error('❌ Supabase connection failed!');
    return {};
  }

  console.log('✅ Supabase connection OK');
  return {};
}

export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log('📈 Check results above for performance metrics');
}