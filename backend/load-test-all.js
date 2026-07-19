import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // Ramp up to 20 virtual users (VUs)
    { duration: '30s', target: 50 },  // Ramp up to 50 VUs (stress point)
    { duration: '30s', target: 100 }, // Ramp up to 100 VUs (max limit test)
    { duration: '15s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Error rate should be less than 5%
    http_req_duration: ['p(95)<1000'], // 95% of requests should be under 1s
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

export default function () {
  // 1. Health checks (very lightweight, tests Node.js event loop overhead)
  group('Health & Ping API', () => {
    const resHealth = http.get(`${BASE_URL}/health`);
    check(resHealth, { 'health check is 200': (r) => r.status === 200 });

    const resPing = http.get(`${BASE_URL}/ping`);
    check(resPing, { 'ping check is 200': (r) => r.status === 200 });
  });

  sleep(1);

  // 2. Sitemap API (retrieves public listings for SEO, tests db query & formatting)
  group('Sitemap API', () => {
    const resSitemap = http.get(`${BASE_URL}/sitemap`);
    check(resSitemap, { 'sitemap is 200': (r) => r.status === 200 });
  });

  sleep(1);

  // 3. Search API (tests full-text database queries)
  group('Search API', () => {
    const resSearch = http.get(`${BASE_URL}/search?city=Hyderabad&type=HOUSE_RENTAL`);
    check(resSearch, {
      'search status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  let listingId = null;
  let ownerId = null;

  // 4. Fetch Listings Feed (tests listing query with pagination and relations)
  group('Listings Feed API', () => {
    const resListings = http.get(`${BASE_URL}/listings?page=1&limit=12`);
    const isOk = check(resListings, {
      'listings feed is 200': (r) => r.status === 200,
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

  // 5. Listing Detail (tests detail page queries & views counter update in DB)
  if (listingId) {
    group('Listing Detail API', () => {
      const resDetail = http.get(`${BASE_URL}/listings/${listingId}`);
      check(resDetail, {
        'listing detail is 200': (r) => r.status === 200,
      });
    });
    sleep(1);
  }

  // 6. User Reviews API (tests user rating aggregations)
  if (ownerId) {
    group('User Reviews API', () => {
      const resReviews = http.get(`${BASE_URL}/reviews/${ownerId}`);
      check(resReviews, {
        'user reviews is 200': (r) => r.status === 200,
      });
    });
    sleep(1);
  }
}
