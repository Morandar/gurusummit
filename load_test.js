import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Ramp up to 200 users over 2 minutes
    { duration: '10m', target: 200 }, // Stay at 200 users for 10 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    errors: ['rate<0.1'],              // Custom error rate
  },
};

// Base URL - replace with your actual deployment URL
const BASE_URL = __ENV.BASE_URL || 'https://your-app-url.vercel.app';

// Simulated user data
const users = [];
for (let i = 1; i <= 1000; i++) {
  users.push({
    personalNumber: `TEST${i.toString().padStart(4, '0')}`,
    firstName: `TestUser${i}`,
    lastName: `TestLast${i}`,
    position: 'Tester',
    password: 'test123'
  });
}

export default function () {
  const userIndex = (__VU - 1) % users.length;
  const user = users[userIndex];

  // Simulate user journey
  const userJourney = Math.random();

  try {
    if (userJourney < 0.3) {
      // 30% - Registration flow
      registrationFlow(user);
    } else if (userJourney < 0.6) {
      // 30% - Login and dashboard view
      loginAndDashboardFlow(user);
    } else if (userJourney < 0.8) {
      // 20% - Booth visiting
      boothVisitFlow(user);
    } else {
      // 20% - Admin operations (lighter load)
      adminFlow();
    }

    // Random sleep between 1-5 seconds to simulate real user behavior
    sleep(Math.random() * 4 + 1);

  } catch (error) {
    console.error(`Error in VU ${__VU}:`, error.message);
    errorRate.add(1);
  }
}

function registrationFlow(user) {
  // Simulate registration
  const registrationPayload = {
    personalNumber: user.personalNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    position: user.position,
    password: user.password
  };

  const response = http.post(`${BASE_URL}/api/register`, JSON.stringify(registrationPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'registration status is 200 or 409 (already exists)': (r) => r.status === 200 || r.status === 409,
    'registration response time < 2000ms': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
}

function loginAndDashboardFlow(user) {
  // First login
  const loginPayload = {
    personalNumber: user.personalNumber,
    password: user.password
  };

  let response = http.post(`${BASE_URL}/api/login`, JSON.stringify(loginPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 1500ms': (r) => r.timings.duration < 1500,
  }) || errorRate.add(1);

  if (response.status !== 200) {
    return; // Skip dashboard if login failed
  }

  // Simulate session/token storage
  const authToken = response.json().token || 'fake-token';

  // Dashboard data requests
  const endpoints = [
    '/api/users/progress',
    '/api/booths',
    '/api/program',
    '/api/notifications',
    '/api/banners'
  ];

  endpoints.forEach(endpoint => {
    response = http.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    check(response, {
      [`${endpoint} status is 200`]: (r) => r.status === 200,
      [`${endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(0.1); // Small delay between requests
  });
}

function boothVisitFlow(user) {
  // Login first
  const loginPayload = {
    personalNumber: user.personalNumber,
    password: user.password
  };

  let response = http.post(`${BASE_URL}/api/login`, JSON.stringify(loginPayload), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    return;
  }

  const authToken = response.json().token || 'fake-token';

  // Get available booths
  response = http.get(`${BASE_URL}/api/booths`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (response.status !== 200) {
    return;
  }

  const booths = response.json();
  if (!booths || booths.length === 0) {
    return;
  }

  // Randomly select 1-3 booths to visit
  const boothsToVisit = Math.floor(Math.random() * 3) + 1;
  const selectedBooths = booths.sort(() => 0.5 - Math.random()).slice(0, boothsToVisit);

  selectedBooths.forEach(booth => {
    // Visit booth
    const visitPayload = {
      userId: user.id || Math.floor(Math.random() * 1000) + 1,
      boothId: booth.id
    };

    response = http.post(`${BASE_URL}/api/visits`, JSON.stringify(visitPayload), {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    check(response, {
      'booth visit status is 200 or 409 (already visited)': (r) => r.status === 200 || r.status === 409,
      'booth visit response time < 1500ms': (r) => r.timings.duration < 1500,
    }) || errorRate.add(1);

    sleep(0.5); // Simulate time spent at booth
  });
}

function adminFlow() {
  // Simulate admin dashboard access (lighter load)
  const response = http.get(`${BASE_URL}/api/admin/stats`, {
    headers: {
      'Authorization': 'Bearer admin-token', // Would need actual admin token
    },
  });

  check(response, {
    'admin stats status is 200': (r) => r.status === 200,
    'admin stats response time < 2000ms': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
}

// Setup function - runs before the test starts
export function setup() {
  console.log('Starting load test for O2 Guru Summit app');
  console.log('Testing with up to 200 concurrent users');

  // You could add setup logic here, like creating test data
  return {};
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('Load test completed');
}