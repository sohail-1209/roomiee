// Test seed script — creates test accounts, listings, and bookings via API
// Run: node scripts/seed-test.js

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`❌ ${method} ${path} failed:`, res.status, JSON.stringify(data, null, 2));
    return null;
  }
  return data;
}

async function seed() {
  console.log('🌱 Seeding test data...\n');

  // ── 1. Register Owner 1 ──
  console.log('1️⃣  Registering Owner 1...');
  const owner1 = await api('POST', '/auth/register', {
    name: 'Rahul Sharma',
    email: 'rahul.owner3@test.com',
    phone: '9300000001',
    password: 'test1234',
    role: 'OWNER',
  });
  if (!owner1) return;
  const owner1Token = owner1.data.accessToken;
  console.log('   ✅ Owner 1 registered:', owner1.data.user.name);

  // ── 2. Create House Rental Listing (Owner 1) ──
  console.log('\n2️⃣  Creating house rental listing...');
  const listing1 = await api('POST', '/listings', {
    title: 'Spacious 2BHK near Delhi University',
    description: 'Well-ventilated 2BHK flat with modular kitchen, ideal for students. Close to metro station and markets. Semi-furnished with beds, wardrobe, and refrigerator.',
    type: 'HOUSE_RENTAL',
    rent: 18000,
    deposit: 36000,
    maintenance: 2000,
    address: '15, Model Town II',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110009',
    latitude: 28.7134,
    longitude: 77.1985,
    bedrooms: 2,
    bathrooms: 2,
    balcony: true,
    parking: true,
    areaSqFt: 950,
    furnished: true,
    availableFrom: '2026-08-01',
    amenities: {
      wifi: true,
      ac: true,
      washingMachine: true,
      fridge: true,
      kitchen: true,
      lift: true,
      gym: false,
      security: true,
      powerBackup: true,
      waterSupply: true,
      cctv: true,
    },
  }, owner1Token);
  if (!listing1) return;
  console.log('   ✅ Listing created:', listing1.data.title);

  // ── 3. Register Tenant 1 ──
  console.log('\n3️⃣  Registering Tenant 1...');
  const tenant1 = await api('POST', '/auth/register', {
    name: 'Priya Patel',
    email: 'priya.tenant2@test.com',
    phone: '9300000002',
    password: 'test1234',
    role: 'TENANT',
  });
  if (!tenant1) return;
  const tenant1Token = tenant1.data.accessToken;
  console.log('   ✅ Tenant 1 registered:', tenant1.data.user.name);

  // ── 4. Tenant 1 sends request to book listing ──
  console.log('\n4️⃣  Tenant 1 sending booking request...');
  const request1 = await api('POST', '/requests', {
    listingId: listing1.data.id,
    message: 'Hi! I am a second-year student at DU. Looking for a place near campus. I am quiet and non-smoker. Would love to schedule a visit.',
  }, tenant1Token);
  if (!request1) return;
  console.log('   ✅ Booking request sent');

  // ── 5. Owner 1 accepts the request ──
  console.log('\n5️⃣  Owner 1 accepting the request...');
  const accept1 = await api('PATCH', `/requests/${request1.data.id}`, {
    status: 'ACCEPTED',
  }, owner1Token);
  if (!accept1) return;
  console.log('   ✅ Request accepted');

  // ── 6. Register Owner 2 ──
  console.log('\n6️⃣  Registering Owner 2...');
  const owner2 = await api('POST', '/auth/register', {
    name: 'Vikram Singh',
    email: 'vikram.owner2@test.com',
    phone: '9300000003',
    password: 'test1234',
    role: 'OWNER',
  });
  if (!owner2) return;
  const owner2Token = owner2.data.accessToken;
  console.log('   ✅ Owner 2 registered:', owner2.data.user.name);

  // ── 7. Create Hostel Listing (Owner 2) ──
  console.log('\n7️⃣  Creating hostel listing...');
  const listing2 = await api('POST', '/listings', {
    title: 'Student Nest Hostel — Near Bangalore University',
    description: 'Premium student hostel with 24/7 security, Wi-Fi, mess facility, and study rooms. Walking distance to Bangalore University campus.',
    type: 'HOSTEL',
    rent: 8000,
    deposit: 10000,
    maintenance: 0,
    address: '42, Jnanabharathi Main Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560056',
    latitude: 12.9279,
    longitude: 77.5075,
    bedrooms: 1,
    bathrooms: 1,
    balcony: false,
    parking: false,
    areaSqFt: 120,
    furnished: true,
    availableFrom: '2026-07-20',
    amenities: {
      wifi: true,
      ac: false,
      washingMachine: false,
      fridge: false,
      kitchen: true,
      lift: false,
      gym: false,
      security: true,
      powerBackup: true,
      waterSupply: true,
      cctv: true,
    },
    hostelSharing: {
      genderRequired: 'ANY',
      minAge: 18,
      maxAge: 25,
      smoking: false,
      drinking: false,
      vegOnly: false,
      petsAllowed: false,
      tiers: [
        { sharingSize: 4, price: 8000, available: true },
        { sharingSize: 3, price: 10000, available: true },
        { sharingSize: 2, price: 13000, available: true },
        { sharingSize: 1, price: 18000, available: true },
      ],
    },
  }, owner2Token);
  if (!listing2) return;
  console.log('   ✅ Hostel listing created:', listing2.data.title);

  // ── 8. Register Tenant 2 ──
  console.log('\n8️⃣  Registering Tenant 2...');
  const tenant2 = await api('POST', '/auth/register', {
    name: 'Amit Kumar',
    email: 'amit.tenant2@test.com',
    phone: '9300000004',
    password: 'test1234',
    role: 'TENANT',
  });
  if (!tenant2) return;
  const tenant2Token = tenant2.data.accessToken;
  console.log('   ✅ Tenant 2 registered:', tenant2.data.user.name);

  // ── 9. Tenant 2 sends request to Owner 2's hostel ──
  console.log('\n9️⃣  Tenant 2 requesting hostel...');
  const request2 = await api('POST', '/requests', {
    listingId: listing2.data.id,
    message: 'Hey! I need a 2-sharing room at your hostel. I am a CS student at Bangalore University. When can I visit?',
  }, tenant2Token);
  if (!request2) return;
  console.log('   ✅ Hostel request sent');

  // ── 10. Owner 2 accepts ──
  console.log('\n🔟  Owner 2 accepting hostel request...');
  const accept2 = await api('PATCH', `/requests/${request2.data.id}`, {
    status: 'ACCEPTED',
  }, owner2Token);
  if (!accept2) return;
  console.log('   ✅ Hostel request accepted');

  // ── 11. Register Tenant 3 (to join roommate listing) ──
  console.log('\n1️⃣1️⃣  Registering Tenant 3 (roommate seeker)...');
  const tenant3 = await api('POST', '/auth/register', {
    name: 'Sneha Reddy',
    email: 'sneha.tenant2@test.com',
    phone: '9300000005',
    password: 'test1234',
    role: 'TENANT',
  });
  if (!tenant3) return;
  const tenant3Token = tenant3.data.accessToken;
  console.log('   ✅ Tenant 3 registered:', tenant3.data.user.name);

  // ── 12. Create Roommate Listing (Tenant 1) ──
  console.log('\n1️⃣2️⃣  Tenant 1 creating roommate listing...');
  const roommateListing = await api('POST', '/listings', {
    title: 'Looking for flatmate in 3BHK — Lajpat Nagar',
    description: 'I have a 3BHK flat and need 2 flatmates to share. We already have furniture and appliances. Split rent and bills equally. Vegetarian preferred.',
    type: 'ROOM_SHARING',
    rent: 12000,
    deposit: 12000,
    maintenance: 1500,
    address: '78, Lajpat Nagar II',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110024',
    latitude: 28.5714,
    longitude: 77.2385,
    bedrooms: 3,
    bathrooms: 2,
    balcony: true,
    parking: false,
    areaSqFt: 1200,
    furnished: true,
    availableFrom: '2026-08-01',
    amenities: {
      wifi: true,
      ac: true,
      washingMachine: true,
      fridge: true,
      kitchen: true,
      lift: false,
      gym: false,
      security: false,
      powerBackup: false,
      waterSupply: true,
      cctv: false,
    },
    roomSharing: {
      genderRequired: 'FEMALE',
      minAge: 20,
      maxAge: 28,
      occupationPref: 'STUDENT',
      smoking: false,
      drinking: false,
      vegOnly: true,
      petsAllowed: false,
      currentOccupants: 1,
      totalRooms: 3,
    },
  }, tenant1Token);
  if (!roommateListing) return;
  console.log('   ✅ Roommate listing created:', roommateListing.data.title);

  // ── 13. Tenant 3 sends request to join roommate listing ──
  console.log('\n1️⃣3️⃣  Tenant 3 requesting to join roommate listing...');
  const request3 = await api('POST', '/requests', {
    listingId: roommateListing.data.id,
    message: 'Hi Priya! I saw your roommate listing. I am a working professional (25F), non-smoker, vegetarian. Would love to join!',
  }, tenant3Token);
  if (!request3) return;
  console.log('   ✅ Roommate request sent');

  // ── 14. Tenant 1 accepts the roommate request ──
  console.log('\n1️⃣4️⃣  Tenant 1 accepting roommate request...');
  // Tenant 1 created the listing, so they are the "owner" for this listing type
  const accept3 = await api('PATCH', `/requests/${request3.data.id}`, {
    status: 'ACCEPTED',
  }, tenant1Token);
  if (!accept3) return;
  console.log('   ✅ Roommate request accepted');

  console.log('\n🎉 Seed complete!');
  console.log('\n📧 Test accounts:');
  console.log('   Owner 1:  rahul.owner3@test.com  / test1234  (Delhi house)');
  console.log('   Owner 2:  vikram.owner2@test.com  / test1234  (Bangalore hostel)');
  console.log('   Tenant 1: priya.tenant2@test.com / test1234  (booked Delhi + created roommate listing)');
  console.log('   Tenant 2: amit.tenant2@test.com / test1234  (booked Bangalore hostel)');
  console.log('   Tenant 3: sneha.tenant2@test.com / test1234  (joined Delhi roommate listing)');
}

seed().catch(console.error);
