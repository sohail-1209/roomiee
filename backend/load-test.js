import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // Ramp up to 5 virtual users
    { duration: '20s', target: 15 }, // Ramp up to 15 virtual users (load)
    { duration: '15s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Error rate should be less than 5%
    http_req_duration: ['p(95)<800'], // 95% of requests should be under 800ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

export default function () {
  group('1. Health & Ping Check', () => {
    const resHealth = http.get(`${BASE_URL}/health`);
    check(resHealth, {
      'health check is 200': (r) => r.status === 200,
    });

    const resPing = http.get(`${BASE_URL}/ping`);
    check(resPing, {
      'ping check is 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  let listingId = null;
  let ownerId = null;

  group('2. Fetch Listings List', () => {
    const resListings = http.get(`${BASE_URL}/listings`);
    const isOk = check(resListings, {
      'get listings is 200': (r) => r.status === 200,
    });

    if (isOk) {
      try {
        const body = JSON.parse(resListings.body);
        const data = body.data || [];
        if (data.length > 0) {
          listingId = data[0].id;
          ownerId = data[0].owner?.id;
        }
      } catch (e) {
        // parsing failed
      }
    }
  });

  sleep(1);

  if (listingId) {
    group('3. View Listing Detail', () => {
      const resDetail = http.get(`${BASE_URL}/listings/${listingId}`);
      check(resDetail, {
        'get listing detail is 200': (r) => r.status === 200,
      });
    });
    sleep(1);
  }

  if (ownerId) {
    group('4. View Owner Reviews', () => {
      const resReviews = http.get(`${BASE_URL}/reviews/${ownerId}`);
      check(resReviews, {
        'get owner reviews is 200': (r) => r.status === 200,
      });
    });
    sleep(1);
  }
}
