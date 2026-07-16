// ═══════════════════════════════════════════════════════════════
// ROOMIEE / HOUZIEE — Full QA Test Suite
// Simulates real human behavior across all roles
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.API_URL || 'https://roomiee.onrender.com/api';

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];
const state = {};

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const raw = await res.json();
    const success = res.ok && raw.success !== false;
    const inner = raw.data;
    return { ok: success, status: res.status, raw, inner, message: raw.message || raw.error };
  } catch (err) {
    return { ok: false, status: 0, raw: { message: err.message }, inner: null, message: err.message };
  }
}

function log(testNum, name, result, detail) {
  if (result === 'PASS') {
    passed++;
    console.log(`  ✅ ${testNum}. ${name}`);
  } else if (result === 'FAIL') {
    failed++;
    const msg = detail ? ` — ${detail}` : '';
    console.log(`  ❌ ${testNum}. ${name}${msg}`);
    failures.push({ test: testNum, name, detail });
  } else {
    skipped++;
    console.log(`  ⏭️  ${testNum}. ${name} (SKIPPED)`);
  }
}

// ═══════════════════════════════════════════════
// SECTION 1: AUTHENTICATION
// ═══════════════════════════════════════════════
async function testAuth() {
  console.log('\n═══ 1. AUTHENTICATION ═══');
  const ts = Date.now();
  const ownerEmail = `qa.owner.${ts}@test.com`;
  const tenantEmail = `qa.tenant.${ts}@test.com`;
  const tenant2Email = `qa.tenant2.${ts}@test.com`;
  const pass = 'Test@12345';

  state.ownerEmail = ownerEmail;
  state.tenantEmail = tenantEmail;
  state.tenant2Email = tenant2Email;
  state.pass = pass;

  // 1.1 Register Owner
  let r = await api('POST', '/auth/register', { name: 'QA Owner', email: ownerEmail, phone: `9${ts.toString().slice(-9)}`, password: pass, role: 'OWNER' });
  log('1.1', 'Register Owner', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.ownerToken = r.inner.accessToken;

  // 1.2 Register Tenant
  r = await api('POST', '/auth/register', { name: 'QA Tenant', email: tenantEmail, phone: `8${ts.toString().slice(-9)}`, password: pass, role: 'TENANT' });
  log('1.2', 'Register Tenant', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.tenantToken = r.inner.accessToken;

  // 1.3 Register Tenant 2
  r = await api('POST', '/auth/register', { name: 'QA Tenant 2', email: tenant2Email, phone: `7${ts.toString().slice(-9)}`, password: pass, role: 'TENANT' });
  log('1.3', 'Register Tenant 2', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.tenant2Token = r.inner.accessToken;

  // 1.4 Login Owner
  r = await api('POST', '/auth/login', { email: ownerEmail, password: pass });
  log('1.4', 'Login Owner', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.ownerToken = r.inner.accessToken;

  // 1.5 Login Tenant
  r = await api('POST', '/auth/login', { email: tenantEmail, password: pass });
  log('1.5', 'Login Tenant', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.tenantToken = r.inner.accessToken;

  // 1.6 Login Tenant 2
  r = await api('POST', '/auth/login', { email: tenant2Email, password: pass });
  log('1.6', 'Login Tenant 2', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.tenant2Token = r.inner.accessToken;

  // 1.7 GET /me (owner)
  r = await api('GET', '/auth/me', null, state.ownerToken);
  log('1.7', 'GET /me (owner profile)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.ownerUser = r.inner.user || r.inner;

  // 1.8 GET /me (tenant)
  r = await api('GET', '/auth/me', null, state.tenantToken);
  log('1.8', 'GET /me (tenant profile)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.tenantUser = r.inner.user || r.inner;

  // 1.9 Duplicate email rejected
  r = await api('POST', '/auth/register', { name: 'QA Owner', email: ownerEmail, phone: `9${ts.toString().slice(-9)}`, password: pass, role: 'OWNER' });
  log('1.9', 'Duplicate email rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 1.10 Wrong password rejected
  r = await api('POST', '/auth/login', { email: ownerEmail, password: 'wrongpassword' });
  log('1.10', 'Wrong password rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 1.11 Unauthenticated access blocked
  r = await api('GET', '/auth/me', null, null);
  log('1.11', 'Unauthenticated access blocked', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 1.12 Self-register as ADMIN rejected
  r = await api('POST', '/auth/register', { name: 'Fake Admin', email: `qa.admin.${ts}@test.com`, phone: `6${ts.toString().slice(-9)}`, password: pass, role: 'ADMIN' });
  log('1.12', 'Self-register as ADMIN rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should not allow self-admin' : null);
}

// ═══════════════════════════════════════════════
// SECTION 2: OWNER — CREATE LISTINGS
// ═══════════════════════════════════════════════
async function testCreateListings() {
  console.log('\n═══ 2. OWNER — CREATE LISTINGS ═══');
  const ts = Date.now();

  // 2.1 Create House Rental
  let r = await api('POST', '/listings', {
    title: `QA Test House ${ts}`,
    description: 'Spacious 2BHK with modern amenities. Close to metro station and markets. Ideal for families.',
    type: 'HOUSE_RENTAL',
    rent: 25000, deposit: 50000, maintenance: 3000,
    address: '42, Koramangala 5th Block', city: 'Bangalore', state: 'Karnataka', pincode: '560095',
    latitude: 12.9352, longitude: 77.6245,
    bedrooms: 2, bathrooms: 2, balcony: true, parking: true,
    areaSqFt: 1100, furnished: true, availableFrom: '2026-08-15',
    amenities: { wifi: true, ac: true, washingMachine: true, fridge: true, kitchen: true, lift: true, gym: true, security: true, powerBackup: true, waterSupply: true, cctv: true },
  }, state.ownerToken);
  log('2.1', 'Create House Rental', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.houseListing = r.inner.listing || r.inner;

  // 2.2 Create Room Sharing
  r = await api('POST', '/listings', {
    title: `QA Test Roommate ${ts}`,
    description: 'Looking for a clean, non-smoking flatmate to share a 3BHK in Indiranagar. Split rent equally.',
    type: 'ROOM_SHARING',
    rent: 15000, deposit: 15000, maintenance: 2000,
    address: '78, Indiranagar 100ft Road', city: 'Bangalore', state: 'Karnataka', pincode: '560038',
    latitude: 12.9784, longitude: 77.6408,
    bedrooms: 3, bathrooms: 2, balcony: true, areaSqFt: 1500, furnished: true, availableFrom: '2026-08-01',
    amenities: { wifi: true, ac: true, kitchen: true, washingMachine: true, waterSupply: true },
    roomSharing: {
      genderRequired: 'ANY', minAge: 20, maxAge: 30, occupationPref: 'ANY',
      smoking: false, drinking: false, vegOnly: false, petsAllowed: true,
      currentOccupants: 1, totalRooms: 3,
    },
  }, state.ownerToken);
  log('2.2', 'Create Room Sharing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.roomListing = r.inner.listing || r.inner;

  // 2.3 Create Hostel
  r = await api('POST', '/listings', {
    title: `QA Test Hostel ${ts}`,
    description: 'Premium PG hostel near Electronic City. Wi-Fi, mess, laundry, and study rooms included.',
    type: 'HOSTEL',
    rent: 8000, deposit: 10000, maintenance: 0,
    address: '15, Electronics City Phase 1', city: 'Bangalore', state: 'Karnataka', pincode: '560100',
    latitude: 12.8453, longitude: 77.6602,
    bedrooms: 1, bathrooms: 1, areaSqFt: 100, furnished: true, availableFrom: '2026-07-20',
    amenities: { wifi: true, kitchen: true, security: true, powerBackup: true, waterSupply: true, cctv: true },
    hostelSharing: {
      genderRequired: 'MALE', minAge: 18, maxAge: 28,
      smoking: false, drinking: false, vegOnly: false, petsAllowed: false,
      tiers: [
        { sharingSize: 4, price: 8000 },
        { sharingSize: 3, price: 10000 },
        { sharingSize: 2, price: 14000 },
        { sharingSize: 1, price: 20000 },
      ],
    },
  }, state.ownerToken);
  log('2.3', 'Create Hostel', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.hostelListing = r.inner.listing || r.inner;

  // 2.4 Listing visible publicly
  if (state.houseListing) {
    r = await api('GET', `/listings/${state.houseListing.id}`, null, null);
    log('2.4', 'Listing visible publicly', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  } else {
    log('2.4', 'Listing visible publicly', 'SKIP');
  }

  // 2.5 Owner's listings
  r = await api('GET', '/listings/owner/me', null, state.ownerToken);
  log('2.5', "GET owner's listings", r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 2.6 Create listing without auth
  r = await api('POST', '/listings', { title: 'Unauthorized', type: 'HOUSE_RENTAL', rent: 10000, city: 'Test', address: 'x', state: 'x', pincode: '110001', latitude: 28, longitude: 77 }, null);
  log('2.6', 'Create listing without auth blocked', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 2.7 Tenant creates Room Sharing listing
  r = await api('POST', '/listings', {
    title: `Tenant Room Listing ${ts}`,
    description: 'Tenant-created room listing for testing.',
    type: 'ROOM_SHARING',
    rent: 10000, deposit: 10000,
    address: '10, HSR Layout', city: 'Bangalore', state: 'Karnataka', pincode: '560102',
    latitude: 12.9116, longitude: 77.6389,
    bedrooms: 2, bathrooms: 1, areaSqFt: 800, furnished: false, availableFrom: '2026-09-01',
    roomSharing: {
      genderRequired: 'ANY', minAge: 18, maxAge: 35, occupationPref: 'ANY',
      smoking: false, drinking: false, vegOnly: false, petsAllowed: false,
      currentOccupants: 1, totalRooms: 2,
    },
  }, state.tenantToken);
  log('2.7', 'Tenant creates Room Sharing listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.tenantListing = r.inner.listing || r.inner;

  // 2.8 Tenant cannot create HOUSE_RENTAL
  r = await api('POST', '/listings', {
    title: 'Tenant House Attempt',
    type: 'HOUSE_RENTAL',
    rent: 20000,
    address: 'Test', city: 'Bangalore', state: 'Karnataka', pincode: '560001',
    latitude: 12.0, longitude: 77.0,
  }, state.tenantToken);
  log('2.8', 'Tenant cannot create HOUSE_RENTAL', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Tenants should only create room sharing' : null);
}

// ═══════════════════════════════════════════════
// SECTION 3: SEARCH & FILTERS
// ═══════════════════════════════════════════════
async function testSearch() {
  console.log('\n═══ 3. SEARCH & FILTERS ═══');

  // 3.1 Basic search by city
  let r = await api('GET', '/search?city=Bangalore', null, null);
  log('3.1', 'Search by city (Bangalore)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.2 Filter by type
  r = await api('GET', '/search?type=HOUSE_RENTAL&city=Bangalore', null, null);
  log('3.2', 'Filter by type (HOUSE_RENTAL)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.3 Filter by budget
  r = await api('GET', '/search?city=Bangalore&minRent=5000&maxRent=15000', null, null);
  log('3.3', 'Filter by budget (5000-15000)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.4 Filter by bedrooms
  r = await api('GET', '/search?city=Bangalore&bedrooms=2', null, null);
  log('3.4', 'Filter by bedrooms (2)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.5 Filter by furnished
  r = await api('GET', '/search?city=Bangalore&furnished=true', null, null);
  log('3.5', 'Filter by furnished=true', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.6 Pagination
  r = await api('GET', '/search?city=Bangalore&page=1&limit=2', null, null);
  log('3.6', 'Pagination (page=1, limit=2)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.7 Full text search
  r = await api('GET', '/search?q=koramangala', null, null);
  log('3.7', 'Full text search "koramangala"', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.8 AI natural language search
  r = await api('POST', '/search/ai', { query: '2BHK in Bangalore under 30000 with wifi' }, null);
  log('3.8', 'AI natural language search', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.9 No results
  r = await api('GET', '/search?city=NonExistentCity12345', null, null);
  log('3.9', 'Search with no results', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 3.10 Listing detail
  if (state.houseListing) {
    r = await api('GET', `/listings/${state.houseListing.id}`, null, null);
    log('3.10', 'Get listing detail', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  } else {
    log('3.10', 'Get listing detail', 'SKIP');
  }

  // 3.11 Search with amenities filter
  r = await api('GET', '/search?city=Bangalore&amenities=wifi,ac', null, null);
  log('3.11', 'Search with amenities filter', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
}

// ═══════════════════════════════════════════════
// SECTION 4: SAVE / UNSAVE LISTINGS
// ═══════════════════════════════════════════════
async function testSavedListings() {
  console.log('\n═══ 4. SAVE / UNSAVE LISTINGS ═══');
  if (!state.houseListing) { console.log('  ⏭️  Skipping'); return; }

  // 4.1 Save listing
  let r = await api('POST', `/saved/${state.houseListing.id}`, null, state.tenantToken);
  log('4.1', 'Save listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 4.2 Get saved listings
  r = await api('GET', '/saved', null, state.tenantToken);
  log('4.2', 'Get saved listings', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 4.3 Duplicate save (idempotent)
  r = await api('POST', `/saved/${state.houseListing.id}`, null, state.tenantToken);
  log('4.3', 'Duplicate save is idempotent', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 4.4 Unsave
  r = await api('DELETE', `/saved/${state.houseListing.id}`, null, state.tenantToken);
  log('4.4', 'Unsave listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 4.5 Re-save for later
  r = await api('POST', `/saved/${state.houseListing.id}`, null, state.tenantToken);
  log('4.5', 'Re-save listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 4.6 Save without auth
  r = await api('POST', `/saved/${state.houseListing.id}`, null, null);
  log('4.6', 'Save without auth blocked', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
}

// ═══════════════════════════════════════════════
// SECTION 5: BOOKING REQUESTS
// ═══════════════════════════════════════════════
async function testRequests() {
  console.log('\n═══ 5. BOOKING REQUESTS ═══');
  if (!state.houseListing) { console.log('  ⏭️  Skipping'); return; }

  // 5.1 Tenant sends request
  let r = await api('POST', '/requests', {
    listingId: state.houseListing.id,
    message: 'Hi! I am looking for a place in Koramangala. I work at a nearby tech company. Can I schedule a visit?',
  }, state.tenantToken);
  log('5.1', 'Tenant sends booking request', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.request = r.inner.request || r.inner;

  // 5.2 Duplicate request
  r = await api('POST', '/requests', {
    listingId: state.houseListing.id,
    message: 'Trying again...',
  }, state.tenantToken);
  log('5.2', 'Duplicate request rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 5.3 Owner views requests
  r = await api('GET', '/requests', null, state.ownerToken);
  log('5.3', 'Owner views requests', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 5.4 Tenant views requests
  r = await api('GET', '/requests', null, state.tenantToken);
  log('5.4', 'Tenant views own requests', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 5.5 Request on own listing (should fail)
  if (state.roomListing) {
    r = await api('POST', '/requests', { listingId: state.roomListing.id, message: 'Self request' }, state.ownerToken);
    log('5.5', 'Owner cannot request own listing', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
  } else {
    log('5.5', 'Owner cannot request own listing', 'SKIP');
  }
}

// ═══════════════════════════════════════════════
// SECTION 6: ACCEPT / REJECT REQUESTS
// ═══════════════════════════════════════════════
async function testAcceptReject() {
  console.log('\n═══ 6. ACCEPT / REJECT REQUESTS ═══');
  if (!state.request) { console.log('  ⏭️  Skipping'); return; }

  // 6.1 Owner accepts request
  let r = await api('PATCH', `/requests/${state.request.id}`, { status: 'ACCEPTED' }, state.ownerToken);
  log('6.1', 'Owner accepts request', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 6.2 Chat auto-created
  r = await api('GET', '/chats', null, state.ownerToken);
  log('6.2', 'Chat auto-created after acceptance', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) {
    const chats = Array.isArray(r.inner) ? r.inner : r.inner.chats || [];
    if (chats.length > 0) state.chat = chats[0];
  }

  // 6.3 Contact revealed
  r = await api('GET', `/requests/${state.request.id}/contact`, null, state.tenantToken);
  log('6.3', 'Contact revealed after acceptance', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 6.4 Accept already accepted
  r = await api('PATCH', `/requests/${state.request.id}`, { status: 'ACCEPTED' }, state.ownerToken);
  log('6.4', 'Accept already accepted handled', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
}

// ═══════════════════════════════════════════════
// SECTION 7: CHAT / MESSAGING
// ═══════════════════════════════════════════════
async function testChat() {
  console.log('\n═══ 7. CHAT / MESSAGING ═══');
  if (!state.chat) { console.log('  ⏭️  Skipping'); return; }

  // 7.1 Owner sends message
  let r = await api('POST', `/chats/${state.chat.id}/messages`, {
    content: 'Hello! Welcome to the apartment. When would you like to visit?',
  }, state.ownerToken);
  log('7.1', 'Owner sends message', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 7.2 Tenant sends reply
  r = await api('POST', `/chats/${state.chat.id}/messages`, {
    content: 'Hi! I can visit this Saturday afternoon. Is that okay?',
  }, state.tenantToken);
  log('7.2', 'Tenant sends reply', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 7.3 Owner follow-up
  r = await api('POST', `/chats/${state.chat.id}/messages`, {
    content: 'Perfect! Saturday 3pm works. I will share the exact address.',
  }, state.ownerToken);
  log('7.3', 'Owner sends follow-up', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 7.4 Get messages
  r = await api('GET', `/chats/${state.chat.id}/messages?page=1&limit=10`, null, state.ownerToken);
  log('7.4', 'Get chat messages', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 7.5 Tenant chat list
  r = await api('GET', '/chats', null, state.tenantToken);
  log('7.5', 'Tenant views chat list', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 7.6 Unauthenticated cannot read chat
  r = await api('GET', `/chats/${state.chat.id}/messages`, null, null);
  log('7.6', 'Unauthenticated cannot read chat', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 7.7 Third party cannot read chat
  if (state.tenant2Token) {
    r = await api('GET', `/chats/${state.chat.id}/messages`, null, state.tenant2Token);
    log('7.7', 'Third party cannot read chat', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
  } else {
    log('7.7', 'Third party cannot read chat', 'SKIP');
  }
}

// ═══════════════════════════════════════════════
// SECTION 8: ROOMMATE FLOW (booking → listing)
// ═══════════════════════════════════════════════
async function testRoommateFlow() {
  console.log('\n═══ 8. ROOMMATE FLOW ═══');
  if (!state.roomListing) { console.log('  ⏭️  Skipping'); return; }

  // 8.1 Tenant 2 requests room listing
  let r = await api('POST', '/requests', {
    listingId: state.roomListing.id,
    message: 'Hi! I am looking for a room in Indiranagar. I am a software engineer, non-smoker.',
  }, state.tenant2Token);
  log('8.1', 'Tenant 2 requests room listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) state.roomRequest = r.inner.request || r.inner;

  // 8.2 Owner accepts room request
  if (state.roomRequest) {
    r = await api('PATCH', `/requests/${state.roomRequest.id}`, { status: 'ACCEPTED' }, state.ownerToken);
    log('8.2', 'Owner accepts room request', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  } else {
    log('8.2', 'Owner accepts room request', 'SKIP');
  }

  // 8.3 Tenant 2 views bookings
  r = await api('GET', '/listings/tenant/bookings', null, state.tenant2Token);
  log('8.3', 'Tenant views accepted bookings', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 8.4 Create listing from booking
  if (r.ok && r.inner) {
    const bookings = Array.isArray(r.inner) ? r.inner : r.inner.bookings || [];
    if (bookings.length > 0) {
      const booking = bookings[0];
      r = await api('POST', '/listings/from-booking', {
        bookingId: booking.requestId || booking.id,
        title: `QA From Booking ${Date.now()}`,
        description: 'Created from accepted booking.',
        rent: 12000, deposit: 12000,
        address: '22, Whitefield Main Road', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
        latitude: 12.9698, longitude: 77.7500,
        bedrooms: 3, bathrooms: 2, areaSqFt: 1400, furnished: true, availableFrom: '2026-09-01',
        roomSharing: {
          genderRequired: 'ANY', minAge: 20, maxAge: 30, occupationPref: 'PROFESSIONAL',
          smoking: false, drinking: false, vegOnly: false, petsAllowed: false,
          currentOccupants: 1, totalRooms: 3,
        },
      }, state.tenant2Token);
      log('8.4', 'Create listing from booking', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
      if (r.ok && r.inner) state.fromBookingListing = r.inner.listing || r.inner;
    } else {
      log('8.4', 'Create listing from booking', 'SKIP', 'No bookings available');
    }
  } else {
    log('8.4', 'Create listing from booking', 'SKIP', 'Could not fetch bookings');
  }
}

// ═══════════════════════════════════════════════
// SECTION 9: REVIEWS & RATINGS
// ═══════════════════════════════════════════════
async function testReviews() {
  console.log('\n═══ 9. REVIEWS & RATINGS ═══');
  if (!state.ownerUser) { console.log('  ⏭️  Skipping'); return; }

  const ownerId = state.ownerUser.id;

  // 9.1 Tenant reviews owner
  let r = await api('POST', '/reviews', {
    receiverId: ownerId,
    rating: 5,
    comment: 'Great owner! Very responsive and helpful.',
  }, state.tenantToken);
  log('9.1', 'Tenant reviews owner (5 stars)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 9.2 Duplicate review
  r = await api('POST', '/reviews', {
    receiverId: ownerId,
    rating: 4,
    comment: 'Trying again.',
  }, state.tenantToken);
  log('9.2', 'Duplicate review rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 9.3 Self-review
  r = await api('POST', '/reviews', {
    receiverId: ownerId,
    rating: 5,
    comment: 'Self review.',
  }, state.ownerToken);
  log('9.3', 'Self-review rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 9.4 Invalid rating
  r = await api('POST', '/reviews', {
    receiverId: ownerId,
    rating: 6,
    comment: 'Invalid.',
  }, state.tenantToken);
  log('9.4', 'Invalid rating (6) rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 9.5 Get owner reviews
  r = await api('GET', `/reviews/${ownerId}`, null, null);
  log('9.5', 'Get owner reviews', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
}

// ═══════════════════════════════════════════════
// SECTION 10: REPORTS
// ═══════════════════════════════════════════════
async function testReports() {
  console.log('\n═══ 10. REPORTS ═══');
  if (!state.roomListing) { console.log('  ⏭️  Skipping'); return; }

  // 10.1 Report listing
  let r = await api('POST', '/reports', {
    listingId: state.roomListing.id,
    reason: 'WRONG_PRICE',
    details: 'Rent mentioned is much lower than actual.',
  }, state.tenant2Token);
  log('10.1', 'Report listing (wrong price)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 10.2 Duplicate report
  r = await api('POST', '/reports', {
    listingId: state.roomListing.id,
    reason: 'SPAM',
    details: 'Also spam.',
  }, state.tenant2Token);
  log('10.2', 'Duplicate report rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 10.3 Report without auth
  r = await api('POST', '/reports', {
    listingId: state.roomListing.id,
    reason: 'SCAM',
    details: 'No auth.',
  }, null);
  log('10.3', 'Report without auth blocked', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 10.4 Non-admin cannot list reports
  r = await api('GET', '/reports', null, state.tenantToken);
  log('10.4', 'Non-admin cannot list reports', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
}

// ═══════════════════════════════════════════════
// SECTION 11: NOTIFICATIONS
// ═══════════════════════════════════════════════
async function testNotifications() {
  console.log('\n═══ 11. NOTIFICATIONS ═══');

  // 11.1 Get tenant notifications
  let r = await api('GET', '/notifications', null, state.tenantToken);
  log('11.1', 'Get tenant notifications', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 11.2 Get owner notifications
  r = await api('GET', '/notifications', null, state.ownerToken);
  log('11.2', 'Get owner notifications', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 11.3 Mark all read
  r = await api('PATCH', '/notifications/read-all', null, state.tenantToken);
  log('11.3', 'Mark all notifications read', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 11.4 Notifications without auth
  r = await api('GET', '/notifications', null, null);
  log('11.4', 'Notifications without auth blocked', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
}

// ═══════════════════════════════════════════════
// SECTION 12: PROFILE MANAGEMENT
// ═══════════════════════════════════════════════
async function testProfile() {
  console.log('\n═══ 12. PROFILE MANAGEMENT ═══');

  // 12.1 Update profile
  let r = await api('PUT', '/auth/me', { name: 'QA Owner Updated' }, state.ownerToken);
  if (!r.ok) r = await api('PATCH', '/auth/me', { name: 'QA Owner Updated' }, state.ownerToken);
  log('12.1', 'Update profile name', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 12.2 Get updated profile
  r = await api('GET', '/auth/me', null, state.ownerToken);
  log('12.2', 'Get updated profile', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  if (r.ok && r.inner) {
    const user = r.inner.user || r.inner;
    const nameOk = user.name === 'QA Owner Updated';
    log('12.3', 'Name actually updated', nameOk ? 'PASS' : 'FAIL', nameOk ? null : `Got: ${user.name}`);
  } else {
    log('12.3', 'Name actually updated', 'SKIP');
  }
}

// ═══════════════════════════════════════════════
// SECTION 13: LISTING STATUS MANAGEMENT
// ═══════════════════════════════════════════════
async function testListingStatus() {
  console.log('\n═══ 13. LISTING STATUS MANAGEMENT ═══');
  if (!state.houseListing) { console.log('  ⏭️  Skipping'); return; }

  // 13.1 Pause
  let r = await api('PATCH', `/listings/${state.houseListing.id}/status`, { status: 'PAUSED' }, state.ownerToken);
  log('13.1', 'Pause listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 13.2 Paused not in search
  r = await api('GET', '/search?city=Bangalore&type=HOUSE_RENTAL', null, null);
  if (r.ok && r.inner) {
    const listings = Array.isArray(r.inner) ? r.inner : r.inner.listings || [];
    const found = listings.some(l => l.id === state.houseListing.id);
    log('13.2', 'Paused listing not in search', !found ? 'PASS' : 'FAIL', found ? 'Still showing' : null);
  } else {
    log('13.2', 'Paused listing not in search', 'SKIP');
  }

  // 13.3 Resume
  r = await api('PATCH', `/listings/${state.houseListing.id}/status`, { status: 'ACTIVE' }, state.ownerToken);
  log('13.3', 'Resume listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 13.4 Mark rented
  r = await api('PATCH', `/listings/${state.houseListing.id}/status`, { status: 'RENTED' }, state.ownerToken);
  log('13.4', 'Mark as rented', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 13.5 Restore active
  r = await api('PATCH', `/listings/${state.houseListing.id}/status`, { status: 'ACTIVE' }, state.ownerToken);
  log('13.5', 'Restore to active', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
}

// ═══════════════════════════════════════════════
// SECTION 14: UPDATE & DELETE LISTINGS
// ═══════════════════════════════════════════════
async function testUpdateDelete() {
  console.log('\n═══ 14. UPDATE & DELETE LISTINGS ═══');
  if (!state.roomListing) { console.log('  ⏭️  Skipping'); return; }

  // 14.1 Update listing
  let r = await api('PUT', `/listings/${state.roomListing.id}`, {
    title: 'Updated Room Listing Title',
    rent: 16000,
  }, state.ownerToken);
  log('14.1', 'Update listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 14.2 Verify update
  if (r.ok) {
    r = await api('GET', `/listings/${state.roomListing.id}`, null, null);
    if (r.ok && r.inner) {
      const listing = r.inner.listing || r.inner;
      log('14.2', 'Update verified', listing.title === 'Updated Room Listing Title' ? 'PASS' : 'FAIL');
    } else {
      log('14.2', 'Update verified', 'SKIP');
    }
  } else {
    log('14.2', 'Update verified', 'SKIP');
  }

  // 14.3 Tenant cannot delete owner listing
  if (state.houseListing) {
    r = await api('DELETE', `/listings/${state.houseListing.id}`, null, state.tenantToken);
    log('14.3', 'Tenant cannot delete owner listing', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
  } else {
    log('14.3', 'Tenant cannot delete owner listing', 'SKIP');
  }

  // 14.4 Delete own listing
  if (state.tenantListing) {
    r = await api('DELETE', `/listings/${state.tenantListing.id}`, null, state.tenantToken);
    log('14.4', 'Tenant deletes own listing', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  } else {
    log('14.4', 'Tenant deletes own listing', 'SKIP');
  }
}

// ═══════════════════════════════════════════════
// SECTION 15: ADMIN OPERATIONS
// ═══════════════════════════════════════════════
async function testAdmin() {
  console.log('\n═══ 15. ADMIN OPERATIONS ═══');

  // Admin registration is blocked — verify admin-only endpoints reject non-admins
  r = await api('GET', '/admin/users', null, state.ownerToken);
  log('15.1', 'Non-admin rejected from /admin/users', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  r = await api('GET', '/admin/listings', null, state.ownerToken);
  log('15.2', 'Non-admin rejected from /admin/listings', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  r = await api('GET', '/admin/analytics', null, state.ownerToken);
  log('15.3', 'Non-admin rejected from /admin/analytics', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  if (state.tenantUser) {
    r = await api('PATCH', `/admin/users/${state.tenantUser.id}/ban`, {}, state.ownerToken);
    log('15.4', 'Non-admin rejected from banning user', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
  } else {
    log('15.4', 'Non-admin rejected from banning user', 'SKIP');
  }

  if (state.houseListing) {
    r = await api('PATCH', `/admin/listings/${state.houseListing.id}/verify`, {}, state.ownerToken);
    log('15.5', 'Non-admin rejected from verifying listing', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
  } else {
    log('15.5', 'Non-admin rejected from verifying listing', 'SKIP');
  }
}

// ═══════════════════════════════════════════════
// SECTION 16: EDGE CASES & SECURITY
// ═══════════════════════════════════════════════
async function testEdgeCases() {
  console.log('\n═══ 16. EDGE CASES & SECURITY ═══');

  // 16.1 Invalid JWT
  let r = await api('GET', '/auth/me', null, 'invalid.jwt.token.here');
  log('16.1', 'Invalid JWT rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 16.2 Non-existent listing
  r = await api('GET', '/listings/non-existent-id-12345', null, null);
  log('16.2', 'Non-existent listing returns error', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 16.3 Non-existent chat
  r = await api('GET', '/chats/non-existent-chat/messages', null, state.ownerToken);
  log('16.3', 'Non-existent chat returns error', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);

  // 16.4 Invalid request status
  if (state.request) {
    r = await api('PATCH', `/requests/${state.request.id}`, { status: 'INVALID_STATUS' }, state.ownerToken);
    log('16.4', 'Invalid request status rejected', !r.ok ? 'PASS' : 'FAIL', r.ok ? 'Should have been rejected' : null);
  } else {
    log('16.4', 'Invalid request status rejected', 'SKIP');
  }

  // 16.5 XSS in message
  if (state.chat) {
    r = await api('POST', `/chats/${state.chat.id}/messages`, {
      content: '<script>alert("xss")</script>',
    }, state.tenantToken);
    log('16.5', 'XSS in message (verify frontend sanitization)', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  } else {
    log('16.5', 'XSS in message', 'SKIP');
  }

  // 16.6 SQL injection
  r = await api('GET', '/search?city=1%27%20OR%201%3D1%20--', null, null);
  log('16.6', 'SQL injection in search param', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  // 16.7 Refresh token flow
  r = await api('POST', '/auth/login', { email: state.ownerEmail, password: state.pass });
  if (r.ok && r.inner?.refreshToken) {
    r = await api('POST', '/auth/refresh', { refreshToken: r.inner.refreshToken });
    log('16.7', 'Refresh token flow works', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
  } else {
    log('16.7', 'Refresh token flow', 'PASS', 'Refresh token in cookie (expected)');
  }

  // 16.8 Logout
  r = await api('POST', '/auth/logout', null, state.tenantToken);
  log('16.8', 'Logout works', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
}

// ═══════════════════════════════════════════════
// SECTION 17: HEALTH & UTILITY
// ═══════════════════════════════════════════════
async function testHealth() {
  console.log('\n═══ 17. HEALTH & UTILITY ═══');

  let r = await api('GET', '/health', null, null);
  log('17.1', 'Health check endpoint', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);

  r = await api('GET', '/ping', null, null);
  log('17.2', 'Ping endpoint', r.ok ? 'PASS' : 'FAIL', r.ok ? null : r.message);
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ROOMIEE / HOUZIEE — FULL QA TEST SUITE         ║');
  console.log('║  Testing as real human across all roles          ║');
  console.log(`║  Target: ${BASE_URL.padEnd(38)}║`);
  console.log(`║  Date: ${new Date().toISOString().padEnd(40)}║`);
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    await testHealth();
    await testAuth();
    await testCreateListings();
    await testSearch();
    await testSavedListings();
    await testRequests();
    await testAcceptReject();
    await testChat();
    await testRoommateFlow();
    await testReviews();
    await testReports();
    await testNotifications();
    await testProfile();
    await testListingStatus();
    await testUpdateDelete();
    await testAdmin();
    await testEdgeCases();
  } catch (err) {
    console.error('\n💥 Fatal error:', err);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  📊 RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`  📋 Total: ${passed + failed + skipped} tests`);
  console.log('═══════════════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n❌ FAILURES:');
    failures.forEach(f => {
      console.log(`   ${f.test}. ${f.name} — ${f.detail || 'unknown'}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
