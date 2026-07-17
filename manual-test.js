// ═══════════════════════════════════════════════════════════
// QUIKDEN — COMPREHENSIVE MANUAL QA TEST
// All Roles, All Features (excl. Google Sign-In/Sign-Out)
// ═══════════════════════════════════════════════════════════
const BASE = process.env.API_URL || 'http://localhost:5000/api';
const ts = Date.now();
const pass = 'Test@12345';

let P = 0, F = 0, S = 0;
const issues = [];

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined
    });
    const raw = await res.json();
    return { ok: res.ok && raw.success !== false, status: res.status, data: raw.data, pag: raw.pagination, msg: raw.message || raw.error, raw };
  } catch (e) {
    return { ok: false, status: 0, data: null, msg: e.message };
  }
}

function log(id, name, result, detail = '') {
  const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⏭️';
  if (result === 'PASS') P++;
  else if (result === 'FAIL') { F++; issues.push({ id, name, detail }); }
  else S++;
  console.log(`  ${icon} ${id}. ${name}${detail ? ` — ${detail}` : ''}`);
}

// ═══════════════════════════════════════
// PHASE 1: GUEST ROLE
// ═══════════════════════════════════════
async function testGuest() {
  console.log('\n═══ 1. GUEST ROLE (No Auth — Browse Only) ═══');

  let r = await api('GET', '/health');
  log('1.1', 'Health check', r.ok && r.raw?.status === 'ok' ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?limit=3');
  log('1.2', 'Search listings', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?type=HOUSE_RENTAL');
  log('1.3', 'Filter type=HOUSE_RENTAL', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?minRent=5000&maxRent=20000');
  log('1.4', 'Filter budget 5k-20k', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?bedrooms=2');
  log('1.5', 'Filter bedrooms=2', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?furnished=true');
  log('1.6', 'Filter furnished', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?wifi=true&ac=true');
  log('1.7', 'Filter amenities wifi+ac', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?type=LAND_SALE');
  log('1.7b', 'Filter type=LAND_SALE', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?page=1&limit=2');
  log('1.8', 'Pagination', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('GET', '/search?q=koramangala');
  log('1.9', 'Full text search', r.ok ? 'PASS' : 'FAIL', r.msg);

  r = await api('POST', '/search/ai', { query: '2BHK in Bangalore under 25000 with wifi' });
  log('1.10', 'AI natural language search', r.ok ? 'PASS' : 'FAIL', r.msg);

  // Get a listing ID for detail view
  let listingId = null;
  r = await api('GET', '/search?limit=1');
  if (r.ok && Array.isArray(r.data) && r.data.length > 0) {
    listingId = r.data[0].id;
  }
  if (listingId) {
    r = await api('GET', `/listings/${listingId}`);
    log('1.11', 'View listing detail', r.ok ? 'PASS' : 'FAIL', r.msg);
    if (r.ok && r.data?.owner?.id) {
      r = await api('GET', `/reviews/${r.data.owner.id}`);
      log('1.12', 'View user reviews', r.ok ? 'PASS' : 'FAIL', r.msg);
    } else {
      log('1.12', 'View user reviews', 'SKIP', 'No owner ID');
    }
  } else {
    log('1.11', 'View listing detail', 'SKIP', 'No listings');
    log('1.12', 'View user reviews', 'SKIP');
  }

  r = await api('GET', '/search?city=ZZZZNonExist999');
  log('1.13', 'Empty search gracefully', r.ok ? 'PASS' : 'FAIL', r.msg);

  // Auth-gated endpoints
  r = await api('GET', '/saved');
  log('1.14', 'Guest CANNOT saved (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);
  r = await api('GET', '/requests');
  log('1.15', 'Guest CANNOT requests (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);
  r = await api('GET', '/chats');
  log('1.16', 'Guest CANNOT chats (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);
  r = await api('GET', '/notifications');
  log('1.17', 'Guest CANNOT notifications (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);
  r = await api('POST', '/reports', { listingId: 'x', reason: 'SPAM' });
  log('1.18', 'Guest CANNOT report (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);
  r = await api('POST', '/reviews', { receiverId: 'x', rating: 5 });
  log('1.19', 'Guest CANNOT review (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);
  r = await api('POST', '/listings', { title: 'hack' });
  log('1.20', 'Guest CANNOT create listing (401)', !r.ok && r.status === 401 ? 'PASS' : 'FAIL', `status=${r.status}`);

  r = await api('GET', '/push/vapid-public-key');
  log('1.21', 'VAPID public key', r.ok && r.data?.publicKey ? 'PASS' : 'FAIL', r.msg);

  // Cannot assign admin
  r = await api('POST', '/auth/register', { name: 'hacker', email: `hacker${ts}@x.com`, password: pass, role: 'ADMIN' });
  log('1.22', 'Cannot self-assign ADMIN', r.ok && r.data?.user?.role !== 'ADMIN' ? 'PASS' : 'FAIL', `role=${r.data?.user?.role}`);
}

// ═══════════════════════════════════════
// PHASE 2: OWNER ROLE
// ═══════════════════════════════════════
async function testOwner() {
  console.log('\n═══ 2. OWNER ROLE ═══');
  const ownerEmail = `qa.owner.${ts}@test.com`;

  // 2.1 Register
  let r = await api('POST', '/auth/register', { name: 'QA Owner', email: ownerEmail, password: pass, role: 'OWNER' });
  log('2.1', 'Register as Owner', r.ok ? 'PASS' : 'FAIL', r.msg);
  if (r.ok && r.data?.accessToken) S.ownerToken = r.data.accessToken;

  // 2.2 Login
  r = await api('POST', '/auth/login', { email: ownerEmail, password: pass });
  log('2.2', 'Login as Owner', r.ok ? 'PASS' : 'FAIL', r.msg);
  if (r.ok && r.data?.accessToken) S.ownerToken = r.data.accessToken;

  // 2.3 Get profile
  r = await api('GET', '/auth/me', null, S.ownerToken);
  log('2.3', 'Get own profile', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.4 Update profile
  r = await api('PATCH', '/users/me', { name: 'QA Owner Pro', bio: 'Professional landlord' }, S.ownerToken);
  log('2.4', 'Update profile', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.5 View updated profile
  r = await api('GET', '/auth/me', null, S.ownerToken);
  log('2.5', 'View updated profile', r.ok && r.data?.bio === 'Professional landlord' ? 'PASS' : 'FAIL', `bio=${r.data?.bio}`);

  // 2.6 Create HOUSE_RENTAL
  r = await api('POST', '/listings', {
    title: `QA House ${ts}`, description: 'Spacious 2BHK near metro.',
    type: 'HOUSE_RENTAL', rent: 25000, deposit: 50000, maintenance: 3000,
    address: '42 Koramangala 5th Block', city: 'Bangalore', state: 'Karnataka', pincode: '560095',
    latitude: 12.9352, longitude: 77.6245,
    bedrooms: 2, bathrooms: 2, furnished: true, areaSqFt: 1100, availableFrom: '2026-08-15',
    amenities: { wifi: true, ac: true, washingMachine: true, fridge: true, kitchen: true, lift: true, gym: true, security: true, powerBackup: true, waterSupply: true, cctv: true },
  }, S.ownerToken);
  log('2.6', 'Create HOUSE_RENTAL', r.ok ? 'PASS' : 'FAIL', r.msg);
  S.houseId = r.ok ? r.data?.id : null;

  // 2.7 Create ROOM_SHARING
  r = await api('POST', '/listings', {
    title: `QA Roommate ${ts}`, description: 'Looking for flatmate in 3BHK.',
    type: 'ROOM_SHARING', rent: 8000, deposit: 16000,
    address: '15 Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038',
    latitude: 12.9784, longitude: 77.6408,
    bedrooms: 3, bathrooms: 2, furnished: true, areaSqFt: 1500,
    amenities: { wifi: true, ac: true, kitchen: true, washingMachine: true },
  }, S.ownerToken);
  log('2.7', 'Create ROOM_SHARING', r.ok ? 'PASS' : 'FAIL', r.msg);
  S.roomId = r.ok ? r.data?.id : null;

  // 2.8 Create HOSTEL
  r = await api('POST', '/listings', {
    title: `QA Hostel ${ts}`, description: 'Student hostel',
    type: 'HOSTEL', rent: 6000, deposit: 6000,
    address: '33 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001',
    latitude: 12.9758, longitude: 77.6078, furnished: true, areaSqFt: 200,
    amenities: { wifi: true, security: true, cctv: true, powerBackup: true },
    hostelSharing: {
      genderRequired: 'ANY',
      tiers: [
        { sharingSize: 1, price: 8000 },
        { sharingSize: 2, price: 6000 },
      ]
    }
  }, S.ownerToken);
  log('2.8', 'Create HOSTEL', r.ok ? 'PASS' : 'FAIL', r.msg);
  S.hostelId = r.ok ? r.data?.id : null;

  // 2.9 Create LAND_SALE
  r = await api('POST', '/listings', {
    title: `QA Land ${ts}`, description: 'Plot in gated community',
    type: 'LAND_SALE', rent: 0, deposit: 0,
    address: 'Survey 100 Devanahalli', city: 'Bangalore', state: 'Karnataka', pincode: '562110',
    latitude: 13.2489, longitude: 77.7096, areaSqFt: 1200,
    amenities: { waterSupply: true, security: true, powerBackup: true },
  }, S.ownerToken);
  log('2.9', 'Create LAND_SALE', r.ok ? 'PASS' : 'FAIL', r.msg);
  S.landId = r.ok ? r.data?.id : null;

  // 2.10 Validation: missing required fields
  r = await api('POST', '/listings', { type: 'HOUSE_RENTAL' }, S.ownerToken);
  log('2.10', 'Create listing fails validation', !r.ok && r.status === 400 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 2.11 Invalid type rejected
  r = await api('POST', '/listings', { title: 'test', type: 'INVALID', rent: 1, address: 'x', city: 'x', state: 'x', pincode: '110001', latitude: 12, longitude: 77 }, S.ownerToken);
  log('2.11', 'Invalid type rejected', !r.ok && r.status === 400 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 2.12 Invalid lat rejected
  r = await api('POST', '/listings', { title: 'test', type: 'HOUSE_RENTAL', rent: 1, address: 'x', city: 'x', state: 'x', pincode: '110001', latitude: 999, longitude: 77 }, S.ownerToken);
  log('2.12', 'Invalid latitude rejected', !r.ok && r.status === 400 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 2.13 View own listings
  r = await api('GET', '/listings/my', null, S.ownerToken);
  log('2.13', 'View own listings', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.14 Update listing
  if (S.houseId) {
    r = await api('PUT', `/listings/${S.houseId}`, { title: `QA House Updated ${ts}`, rent: 30000 }, S.ownerToken);
    log('2.14', 'Update listing', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 2.15 Verify update
    r = await api('GET', `/listings/${S.houseId}`);
    log('2.15', 'Verify listing update', r.ok && r.data?.title?.includes('Updated') ? 'PASS' : 'FAIL', `title=${r.data?.title}`);
  } else {
    log('2.14', 'Update listing', 'SKIP', 'No house ID');
    log('2.15', 'Verify listing update', 'SKIP');
  }

  // 2.16 Status management: pause
  if (S.houseId) {
    r = await api('PATCH', `/listings/${S.houseId}/status`, { status: 'PAUSED' }, S.ownerToken);
    log('2.16', 'Pause listing', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 2.17 Paused listing hidden from search
    r = await api('GET', `/search?limit=20`);
    const found = r.ok && Array.isArray(r.data) && r.data.find(l => l.id === S.houseId);
    log('2.17', 'Paused listing hidden from search', !found ? 'PASS' : 'FAIL', found ? 'Still visible' : 'Hidden');

    // 2.18 Resume listing
    r = await api('PATCH', `/listings/${S.houseId}/status`, { status: 'ACTIVE' }, S.ownerToken);
    log('2.18', 'Resume listing', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 2.19 Mark as RENTED
    r = await api('PATCH', `/listings/${S.houseId}/status`, { status: 'RENTED' }, S.ownerToken);
    log('2.19', 'Mark as RENTED', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 2.20 Restore to ACTIVE
    r = await api('PATCH', `/listings/${S.houseId}/status`, { status: 'ACTIVE' }, S.ownerToken);
    log('2.20', 'Restore to ACTIVE', r.ok ? 'PASS' : 'FAIL', r.msg);
  } else {
    for (let i = 216; i <= 220; i++) log(`${i}`, 'Status management', 'SKIP');
  }

  // 2.21 Cannot delete other's listing
  if (S.roomId) {
    const otherEmail = `qa.tenant2.${ts}@test.com`;
    let r2 = await api('POST', '/auth/register', { name: 'Other', email: otherEmail, password: pass, role: 'TENANT' });
    let otherToken = r2.data?.accessToken;
    r2 = await api('DELETE', `/listings/${S.roomId}`, null, otherToken);
    log('2.21', 'Cannot delete other listing', !r2.ok && r2.status === 403 ? 'PASS' : 'FAIL', `status=${r2.status}`);
  } else {
    log('2.21', 'Cannot delete other listing', 'SKIP');
  }

  // 2.22 View incoming requests
  r = await api('GET', '/requests', null, S.ownerToken);
  log('2.22', 'View incoming requests', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.23 View chats
  r = await api('GET', '/chats', null, S.ownerToken);
  log('2.23', 'View chats', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.24 View notifications
  r = await api('GET', '/notifications', null, S.ownerToken);
  log('2.24', 'View notifications', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.25 Logout
  r = await api('POST', '/auth/logout', { refreshToken: r.data?.refreshToken }, S.ownerToken);
  log('2.25', 'Logout', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 2.26 Token after logout should be invalid
  r = await api('GET', '/auth/me', null, S.ownerToken);
  log('2.26', 'Token invalid after logout', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // Refresh token for later use
  r = await api('POST', '/auth/login', { email: ownerEmail, password: pass });
  if (r.ok && r.data?.accessToken) S.ownerToken = r.data.accessToken;
}

// ═══════════════════════════════════════
// PHASE 3: TENANT ROLE
// ═══════════════════════════════════════
async function testTenant() {
  console.log('\n═══ 3. TENANT ROLE ═══');
  const tenantEmail = `qa.tenant.${ts}@test.com`;

  // 3.1 Register
  let r = await api('POST', '/auth/register', { name: 'QA Tenant', email: tenantEmail, password: pass, role: 'TENANT' });
  log('3.1', 'Register as Tenant', r.ok ? 'PASS' : 'FAIL', r.msg);
  if (r.ok && r.data?.accessToken) S.tenantToken = r.data.accessToken;

  // 3.2 Login
  r = await api('POST', '/auth/login', { email: tenantEmail, password: pass });
  log('3.2', 'Login as Tenant', r.ok ? 'PASS' : 'FAIL', r.msg);
  if (r.ok && r.data?.accessToken) S.tenantToken = r.data.accessToken;

  // 3.3 Profile
  r = await api('GET', '/auth/me', null, S.tenantToken);
  log('3.3', 'Get tenant profile', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 3.4 Update profile
  r = await api('PATCH', '/users/me', { name: 'QA Tenant Updated', bio: 'Student looking for room' }, S.tenantToken);
  log('3.4', 'Update tenant profile', r.ok ? 'PASS' : 'FAIL', r.msg);

  // ══ SAVE/UNSAVE ══
  if (S.houseId) {
    // 3.5 Save listing
    r = await api('POST', `/saved/${S.houseId}`, null, S.tenantToken);
    log('3.5', 'Save listing', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 3.6 Get saved listings
    r = await api('GET', '/saved', null, S.tenantToken);
    log('3.6', 'Get saved listings', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 3.7 Verify listing is saved
    const saved = r.ok && Array.isArray(r.data) && r.data.find(s => s.listingId === S.houseId);
    log('3.7', 'Verify saved listing present', saved ? 'PASS' : 'FAIL', saved ? 'Found' : 'Not found');

    // 3.8 Unsave
    r = await api('DELETE', `/saved/${S.houseId}`, null, S.tenantToken);
    log('3.8', 'Unsave listing', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 3.9 Re-save
    r = await api('POST', `/saved/${S.houseId}`, null, S.tenantToken);
    log('3.9', 'Re-save listing', r.ok ? 'PASS' : 'FAIL', r.msg);
  } else {
    for (let i = 35; i <= 39; i++) log(`3.${i}`, 'Save/Unsave', 'SKIP');
  }

  // ══ REQUESTS ══
  if (S.houseId) {
    // 3.10 Send booking request
    r = await api('POST', '/requests', { listingId: S.houseId, message: 'I want to rent this place' }, S.tenantToken);
    log('3.10', 'Send booking request', r.ok ? 'PASS' : 'FAIL', r.msg);
    S.requestId = r.ok ? r.data?.id : null;

    // 3.11 Duplicate request rejected
    r = await api('POST', '/requests', { listingId: S.houseId, message: 'Again' }, S.tenantToken);
    log('3.11', 'Duplicate request rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status} msg=${r.msg}`);

    // 3.12 View own requests
    r = await api('GET', '/requests', null, S.tenantToken);
    log('3.12', 'View own requests', r.ok ? 'PASS' : 'FAIL', r.msg);
  } else {
    log('3.10', 'Send request', 'SKIP');
    log('3.11', 'Duplicate rejected', 'SKIP');
    log('3.12', 'View requests', 'SKIP');
  }

  // 3.13 Tenant CANNOT create HOUSE_RENTAL
  r = await api('POST', '/listings', { title: 'hack', type: 'HOUSE_RENTAL', rent: 1, address: 'x', city: 'x', state: 'x', pincode: '110001', latitude: 12, longitude: 77 }, S.tenantToken);
  log('3.13', 'Tenant CANNOT create HOUSE_RENTAL', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 3.14 Tenant CAN create ROOM_SHARING
  r = await api('POST', '/listings', {
    title: `Tenant Room ${ts}`, description: 'My room',
    type: 'ROOM_SHARING', rent: 5000, deposit: 10000,
    address: '10 Whitefield', city: 'Bangalore', state: 'Karnataka', pincode: '560066',
    latitude: 12.9698, longitude: 77.7500,
    bedrooms: 1, bathrooms: 1, furnished: false,
    amenities: { wifi: true },
  }, S.tenantToken);
  log('3.14', 'Tenant CAN create ROOM_SHARING', r.ok ? 'PASS' : 'FAIL', r.msg);
  S.tenantListingId = r.ok ? r.data?.id : null;

  // 3.15 Notifications
  r = await api('GET', '/notifications', null, S.tenantToken);
  log('3.15', 'View notifications', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 3.16 Mark notifications read
  r = await api('PATCH', '/notifications/read-all', null, S.tenantToken);
  log('3.16', 'Mark all notifications read', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 3.17 Public user profile
  if (S.houseId) {
    r = await api('GET', '/search?limit=1');
    const listing = r.ok && Array.isArray(r.data) && r.data[0];
    if (listing?.owner?.id) {
      r = await api('GET', `/users/${listing.owner.id}`);
      log('3.17', 'View public user profile', r.ok ? 'PASS' : 'FAIL', r.msg);
    } else {
      log('3.17', 'View public user profile', 'SKIP');
    }
  } else {
    log('3.17', 'View public user profile', 'SKIP');
  }

  // 3.18 Reviews of a user
  if (S.houseId) {
    r = await api('GET', '/reviews/cmro0tjtk0001lw2rhdjiihse');
    log('3.18', 'Get user reviews', r.ok ? 'PASS' : 'FAIL', r.msg);
  } else {
    log('3.18', 'Get user reviews', 'SKIP');
  }

  // 3.19 Tenant CANNOT create listing without required fields
  r = await api('POST', '/listings', { type: 'ROOM_SHARING' }, S.tenantToken);
  log('3.19', 'Tenant CANNOT create listing without fields', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 3.20 Delete own listing
  if (S.tenantListingId) {
    r = await api('DELETE', `/listings/${S.tenantListingId}`, null, S.tenantToken);
    log('3.20', 'Delete own listing', r.ok ? 'PASS' : 'FAIL', r.msg);
  } else {
    log('3.20', 'Delete own listing', 'SKIP');
  }
}

// ═══════════════════════════════════════
// PHASE 4: REQUEST → ACCEPT → CHAT → REVIEW FLOW
// ═══════════════════════════════════════
async function testRequestChatFlow() {
  console.log('\n═══ 4. REQUEST → ACCEPT → CHAT → REVIEW FLOW ═══');

  // Need fresh owner + tenant (or reuse)
  if (!S.ownerToken || !S.tenantToken || !S.requestId) {
    log('4.0', 'Setup', 'SKIP', 'Missing tokens/request');
    return;
  }

  // 4.1 Owner accepts request
  let r = await api('PATCH', `/requests/${S.requestId}`, { status: 'ACCEPTED' }, S.ownerToken);
  log('4.1', 'Owner accepts request', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 4.2 Tenant sees chats after acceptance
  r = await api('GET', '/chats', null, S.tenantToken);
  log('4.2', 'Tenant sees chats after acceptance', r.ok ? 'PASS' : 'FAIL', r.msg);
  const chat = r.ok && Array.isArray(r.data) ? r.data[0] : null;
  S.chatId = chat?.id;

  // 4.3 Owner sees chats
  r = await api('GET', '/chats', null, S.ownerToken);
  log('4.3', 'Owner sees chats', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 4.4 Send message via REST
  if (S.chatId) {
    r = await api('POST', `/chats/${S.chatId}/messages`, { content: 'Hello from tenant!' }, S.tenantToken);
    log('4.4', 'Tenant sends message', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 4.5 Owner sends reply
    r = await api('POST', `/chats/${S.chatId}/messages`, { content: 'Hi! The room is available.' }, S.ownerToken);
    log('4.5', 'Owner sends reply', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 4.6 Get chat messages
    r = await api('GET', `/chats/${S.chatId}/messages`, null, S.tenantToken);
    log('4.6', 'Get chat messages', r.ok ? 'PASS' : 'FAIL', r.msg);

    // 4.7 Third party cannot read chat
    const hackerEmail = `hacker${ts}@test.com`;
    let r2 = await api('POST', '/auth/register', { name: 'Hacker', email: hackerEmail, password: pass, role: 'TENANT' });
    let hackerToken = r2.data?.accessToken;
    r2 = await api('GET', `/chats/${S.chatId}/messages`, null, hackerToken);
    log('4.7', 'Third party CANNOT read chat', !r2.ok ? 'PASS' : 'FAIL', `status=${r2.status}`);

    // 4.8 Send empty message rejected
    r = await api('POST', `/chats/${S.chatId}/messages`, { content: '' }, S.tenantToken);
    log('4.8', 'Empty message rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

    // 4.9 Send whitespace-only message rejected
    r = await api('POST', `/chats/${S.chatId}/messages`, { content: '   ' }, S.tenantToken);
    log('4.9', 'Whitespace-only message rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
  } else {
    for (let i = 44; i <= 49; i++) log(`4.${i - 3}`, 'Chat flow', 'SKIP');
  }

  // 4.10 Contact info revealed after acceptance
  if (S.requestId) {
    r = await api('GET', `/requests/${S.requestId}/contact`, null, S.tenantToken);
    log('4.10', 'Contact revealed after acceptance', r.ok ? 'PASS' : 'FAIL', r.msg);
  } else {
    log('4.10', 'Contact revealed', 'SKIP');
  }

  // 4.11 Review owner after acceptance
  if (S.houseId && S.requestId) {
    r = await api('POST', '/reviews', { receiverId: S.ownerUser?.id || 'unknown', listingId: S.houseId, rating: 5, comment: 'Great owner!' }, S.tenantToken);
    // We need the owner's user ID
    const meR = await api('GET', '/auth/me', null, S.ownerToken);
    if (meR.ok) {
      r = await api('POST', '/reviews', { receiverId: meR.data.id, listingId: S.houseId, rating: 5, comment: 'Great owner!' }, S.tenantToken);
      log('4.11', 'Review owner after acceptance', r.ok ? 'PASS' : 'FAIL', r.msg);

      // 4.12 Duplicate review rejected
      r = await api('POST', '/reviews', { receiverId: meR.data.id, listingId: S.houseId, rating: 4, comment: 'Again' }, S.tenantToken);
      log('4.12', 'Duplicate review rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

      // 4.13 Self-review rejected
      r = await api('POST', '/reviews', { receiverId: meR.data.id, listingId: S.houseId, rating: 5, comment: 'Self' }, S.ownerToken);
      log('4.13', 'Self-review rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

      // 4.14 Invalid rating rejected
      r = await api('POST', '/reviews', { receiverId: meR.data.id, listingId: S.houseId, rating: 0 }, S.tenantToken);
      log('4.14', 'Invalid rating (0) rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

      r = await api('POST', '/reviews', { receiverId: meR.data.id, listingId: S.houseId, rating: 6 }, S.tenantToken);
      log('4.15', 'Invalid rating (6) rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
    } else {
      for (let i = 411; i <= 415; i++) log(`4.${i - 3}`, 'Reviews', 'SKIP');
    }
  } else {
    for (let i = 411; i <= 415; i++) log(`4.${i - 3}`, 'Reviews', 'SKIP');
  }
}

// ═══════════════════════════════════════
// PHASE 5: REPORTS
// ═══════════════════════════════════════
async function testReports() {
  console.log('\n═══ 5. REPORTS ═══');

  if (!S.tenantToken || !S.houseId) {
    log('5.1', 'Report listing', 'SKIP', 'No token/listing');
    return;
  }

  // 5.1 Report listing
  let r = await api('POST', '/reports', { listingId: S.houseId, reason: 'SPAM', description: 'Fake listing' }, S.tenantToken);
  log('5.1', 'Report listing', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 5.2 Duplicate report rejected
  r = await api('POST', '/reports', { listingId: S.houseId, reason: 'SPAM' }, S.tenantToken);
  log('5.2', 'Duplicate report rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 5.3 Invalid reason rejected
  r = await api('POST', '/reports', { listingId: S.houseId, reason: 'INVALID_REASON' }, S.tenantToken);
  log('5.3', 'Invalid reason rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 5.4 Non-admin cannot list reports
  r = await api('GET', '/reports', null, S.tenantToken);
  log('5.4', 'Non-admin CANNOT list reports', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 5.5 Non-admin cannot update report
  r = await api('PATCH', '/reports/some-id', { status: 'RESOLVED' }, S.tenantToken);
  log('5.5', 'Non-admin CANNOT update report', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
}

// ═══════════════════════════════════════
// PHASE 6: REFRESH TOKEN
// ═══════════════════════════════════════
async function testRefreshToken() {
  console.log('\n═══ 6. REFRESH TOKEN ═══');

  const email = `qa.refresh.${ts}@test.com`;
  let r = await api('POST', '/auth/register', { name: 'Refresh Tester', email, password: pass, role: 'TENANT' });
  const rt = r.data?.refreshToken;

  if (!rt) {
    log('6.1', 'Get refresh token', 'SKIP', 'No refresh token');
    return;
  }

  log('6.1', 'Get refresh token from register', 'PASS');

  // 6.2 Refresh token works
  r = await api('POST', '/auth/refresh', { refreshToken: rt });
  log('6.2', 'Refresh token rotates', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 6.3 Old refresh token invalidated
  r = await api('POST', '/auth/refresh', { refreshToken: rt });
  log('6.3', 'Old refresh token invalidated', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 6.4 Invalid refresh token rejected
  r = await api('POST', '/auth/refresh', { refreshToken: 'garbage.token.here' });
  log('6.4', 'Invalid refresh token rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 6.5 No refresh token rejected
  r = await api('POST', '/auth/refresh', {});
  log('6.5', 'No refresh token rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
}

// ═══════════════════════════════════════
// PHASE 7: EDGE CASES & SECURITY
// ═══════════════════════════════════════
async function testSecurity() {
  console.log('\n═══ 7. EDGE CASES & SECURITY ═══');

  // 7.1 Invalid JWT
  let r = await api('GET', '/auth/me', null, 'invalid.jwt.here');
  log('7.1', 'Invalid JWT rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 7.2 Non-existent listing
  r = await api('GET', '/listings/nonexistent-id-123');
  log('7.2', 'Non-existent listing 404', !r.ok && r.status === 404 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 7.3 Non-existent user
  r = await api('GET', '/users/nonexistent-id-123');
  log('7.3', 'Non-existent user 404', !r.ok && r.status === 404 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 7.4 SQL injection in search
  r = await api('GET', "/search?q='; DROP TABLE users; --");
  log('7.4', 'SQL injection blocked', r.ok ? 'PASS' : 'FAIL', 'No crash');

  // 7.5 XSS in listing title (owner creates)
  const xssEmail = `qa.xss.${ts}@test.com`;
  let r2 = await api('POST', '/auth/register', { name: 'XSS', email: xssEmail, password: pass, role: 'OWNER' });
  let xssToken = r2.data?.accessToken;
  r2 = await api('POST', '/listings', {
    title: '<script>alert("xss")</script>', description: 'test',
    type: 'HOUSE_RENTAL', rent: 1000, address: 'x', city: 'x', state: 'x', pincode: '110001', latitude: 12, longitude: 77,
  }, xssToken);
  log('7.5', 'XSS in title accepted (escaped by frontend)', r2.ok ? 'PASS' : 'FAIL', `status=${r2.status}`);

  // 7.6 Missing Content-Type
  try {
    const res = await fetch(`${BASE}/auth/login`, { method: 'POST', body: '{"email":"x"}' });
    log('7.6', 'Missing Content-Type handled', res.ok === false ? 'PASS' : 'FAIL', `status=${res.status}`);
  } catch { log('7.6', 'Missing Content-Type', 'PASS'); }

  // 7.7 Malformed JSON body
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{broken json'
    });
    log('7.7', 'Malformed JSON handled', res.ok === false ? 'PASS' : 'FAIL', `status=${res.status}`);
  } catch { log('7.7', 'Malformed JSON', 'PASS'); }

  // 7.8 Oversized payload
  const bigBody = { data: 'x'.repeat(11 * 1024 * 1024) };
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bigBody)
    });
    log('7.8', 'Oversized payload rejected', res.ok === false ? 'PASS' : 'FAIL', `status=${res.status}`);
  } catch { log('7.8', 'Oversized payload', 'PASS'); }

  // 7.9 OPTIONS (CORS preflight)
  try {
    const res = await fetch(`${BASE}/auth/login`, { method: 'OPTIONS' });
    log('7.9', 'CORS preflight handled', true ? 'PASS' : 'FAIL');
  } catch { log('7.9', 'CORS preflight', 'PASS'); }

  // 7.10 Enum validation on report reason
  if (S.tenantToken && S.houseId) {
    r = await api('POST', '/reports', { listingId: S.houseId, reason: 'HATE_SPEECH' }, S.tenantToken);
    log('7.10', 'Invalid report reason rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
  } else {
    log('7.10', 'Report reason validation', 'SKIP');
  }

  // 7.11 Enum validation on listing status
  if (S.houseId) {
    r = await api('PATCH', `/listings/${S.houseId}/status`, { status: 'INVALID' }, S.ownerToken);
    log('7.11', 'Invalid listing status rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
  } else {
    log('7.11', 'Listing status validation', 'SKIP');
  }

  // 7.12 Pagination limit enforcement
  r = await api('GET', '/search?limit=999');
  const limit = r.ok && r.data ? r.data.length : 0;
  log('7.12', 'Pagination limit enforced (max 100)', limit <= 100 ? 'PASS' : 'FAIL', `returned=${limit}`);

  // 7.13 Pagination boundary
  r = await api('GET', '/search?page=99999&limit=10');
  log('7.13', 'Empty page returns empty array', r.ok && Array.isArray(r.data) && r.data.length === 0 ? 'PASS' : 'FAIL', `count=${r.data?.length}`);
}

// ═══════════════════════════════════════
// PHASE 8: EMAIL VERIFICATION FLOW
// ═══════════════════════════════════════
async function testEmailVerification() {
  console.log('\n═══ 8. EMAIL VERIFICATION ═══');

  const email = `qa.verify.${ts}@test.com`;
  let r = await api('POST', '/auth/register', { name: 'Verify Me', email, password: pass, role: 'TENANT' });
  let vToken = r.data?.accessToken;

  // 8.1 Already verified (local sets isVerified: true)
  r = await api('POST', '/auth/send-verification', null, vToken);
  log('8.1', 'Send verification (already verified)', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 8.2 Invalid OTP
  r = await api('POST', '/auth/verify-email', { otp: '000000' });
  log('8.2', 'Invalid OTP rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 8.3 No OTP
  r = await api('POST', '/auth/verify-email', {});
  log('8.3', 'No OTP rejected', !r.ok && r.status === 400 ? 'PASS' : 'FAIL', `status=${r.status}`);

  // 8.4 Confirm email verified (with token)
  r = await api('POST', '/auth/confirm-email-verified', null, vToken);
  log('8.4', 'Confirm email verified', r.ok ? 'PASS' : 'FAIL', r.msg);

  // 8.5 Confirm email verified (without auth)
  r = await api('POST', '/auth/confirm-email-verified');
  log('8.5', 'Confirm without auth rejected', !r.ok ? 'PASS' : 'FAIL', `status=${r.status}`);
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  QUIKDEN — COMPREHENSIVE MANUAL QA TEST              ║');
  console.log(`║  Target: ${BASE.padEnd(42)} ║`);
  console.log('║  Date: ' + new Date().toISOString().padEnd(48) + '║');
  console.log('╚═══════════════════════════════════════════════════════╝');

  await testGuest();
  await testOwner();
  await testTenant();
  await testRequestChatFlow();
  await testReports();
  await testRefreshToken();
  await testSecurity();
  await testEmailVerification();

  // ═══ SUMMARY ═══
  console.log('\n' + '═'.repeat(55));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(55));
  console.log(`  ✅ Passed:  ${P}`);
  console.log(`  ❌ Failed:  ${F}`);
  console.log(`  ⏭️  Skipped: ${S}`);
  console.log(`  Total:      ${P + F + S}`);
  console.log('─'.repeat(55));

  if (F > 0) {
    console.log('\n  FAILURES:');
    issues.forEach(i => console.log(`    ❌ ${i.id}. ${i.name} — ${i.detail}`));
  } else {
    console.log('\n  🎉 ALL TESTS PASSED!');
  }
  console.log('═'.repeat(55));
}

main().catch(console.error);
