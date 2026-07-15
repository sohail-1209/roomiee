# Houziee - Complete Product Plan

## Goal

India's easiest platform to:
- Find rental houses
- Find roommates & hostel/PG accommodation
- List houses, rooms, or hostels for rent
- Build trust between owners and tenants via reviews
- Communicate safely via in-app chat
- Explore nearby facilities via maps
- Search naturally using AI

---

## Authentication

- JWT Authentication (Access + Refresh Tokens)
- bcrypt password hashing
- Optional: Google Login, Phone OTP

---

## User Roles

### 1. Guest
- Browse listings (house, room sharing, hostel)
- Use filters & search
- View photos, map, nearby places
- Read reviews
- Cannot: chat, save, send requests, contact owners

### 2. Tenant
- Login & register
- Save listings
- Send rental/roommate requests
- Create Room Sharing listings (roommate finder)
- Chat with owners (after request accepted)
- Report listings
- Rate owners (1-5 stars + comment)
- View accepted contact numbers

### 3. Owner
- Upload rental listing (house rental)
- Upload room-sharing listing
- Upload hostel/PG listing with multiple sharing tiers
- Accept/reject requests
- Chat with tenants
- View ratings & reviews
- Rate tenants
- Manage listings (edit, pause, mark as rented)

### 4. Admin
- Remove fake listings
- Ban users
- Moderate reports
- Verify listings
- View analytics
- Handle abuse

---

## Pages

### Home Screen
- Hero section with search
- Type filter tabs: All | House | Room | Hostel
- Popular Cities grid
- Featured House Rentals (horizontal scroll)
- Room Sharing listings (horizontal scroll)
- Hostels & PGs (horizontal scroll)
- How It Works section
- Stats bar
- Footer CTA

### Search
- Filters: City (searches address too), Budget, Gender, Bedrooms, Furnished, Amenities
- Listing type tabs: All | House Rental | Room Sharing | Hostel
- Results grid with ListingCards

### AI Search
- Natural language input (e.g., "room under 6000 near Mehdipatnam, female only")
- AI converts to structured filters automatically

### Listing Detail Pages
- **House Rental** (`/listing/:id`): Gallery, stats, amenities, map, nearby, reviews, request/save/share/report
- **Room Sharing** (`/room/:id`): Gallery, roommate preferences, rules, map, nearby, reviews, request
- **Hostel/PG** (`/hostel/:id`): Gallery, sharing tiers (2-share, 3-share etc.), house rules, map, nearby, reviews, request

### Image Gallery (shared component)
- Full-width main image with prev/next arrows
- Photo counter badge
- Thumbnail strip at bottom
- Click-to-navigate between images

### Nearby Places
- Automatically shows: hospitals, schools, colleges, metro stations, bus stops, gyms, restaurants, medical shops, grocery stores, ATMs, petrol pumps
- Uses OpenStreetMap (Overpass API)

### Request Flow
- Tenant sends request → Owner gets notification → Owner accepts → Chat unlocked → Phone visible → Meet offline
- If rejected: status updated

### Saved Listings
- Save/unsave from any listing card or detail page
- Saved page shows all saved listings

### Report Listing
- Reasons: Fake, Wrong Price, Already Rented, Spam, Duplicate, Wrong Location, Scam, Other
- Admin dashboard shows reports with listing, reason, reporter, time

### Chat
- Simple messaging (text + images)
- Typing indicator, seen status, unread count
- Unlocked after owner accepts request

### Reviews
- User-to-user reviews (reviewer reviews receiver)
- Optional listing context
- Star rating (1-5) + comment
- Duplicate prevention (same reviewer + receiver + listing)
- Auto-aggregated avgRating and totalRatings on User
- Displayed on: ListingDetail, HostelDetail, RoomDetail, ProfilePage
- "Write a Review" button for logged-in non-owners

### Notifications
- Push notifications via FCM
- Types: new request, request accepted/rejected, new message, new review

### Dashboard

**Owner Dashboard:**
- My Listings (with status toggle: Active/Paused/Booked)
- Add Listing
- Requests
- Chats
- Analytics
- Profile

**Tenant Dashboard:**
- Dashboard (bookings overview)
- Add Listing (Room Sharing only)
- Saved Listings
- My Requests
- Chats
- Profile

**Admin Dashboard:**
- Users management
- Listings management
- Reports
- Analytics

---

## Listing Creation

### Owner can create:
- House Rental
- Room Sharing
- Hostel/PG (with multiple sharing tiers: 2-share, 3-share, 4-share etc.)

### Tenant can create:
- Room Sharing only (to find roommates)

### Image Upload
- Client-side compression before upload (canvas API)
- Listing photos: max 1200x900px, JPEG quality 0.8
- Profile photos: max 500x500px, JPEG quality 0.8
- Stored on Cloudinary

---

## Hostel/PG Feature

- Multiple sharing tiers with:
  - Sharing size (2, 3, 4, etc.)
  - Price per month
  - Availability toggle
- Add/remove tiers dynamically
- Gender preference
- Age range
- House rules (smoking, drinking, veg only, pets)

---

## Listing Status

- **ACTIVE**: Visible in search, accepting requests
- **PAUSED**: Not visible in search, not accepting requests
- **RENTED/BOOKED**: Visible but shows "Booked" badge
- Owner can cycle status from My Listings page

---

## Database Tables

### Users
- id, name, email, phone, password, role, avgRating, totalRatings, profileImage, fcmToken, isVerified, isBanned, createdAt

### Listings
- id, ownerId, title, description, type (HOUSE_RENTAL/ROOM_SHARING/HOSTEL), status (ACTIVE/RENTED/PAUSED/DELETED), rent, deposit, maintenance, address, city, state, pincode, latitude, longitude, bedrooms, bathrooms, balcony, parking, areaSqFt, furnished, availableFrom, views, createdAt

### Amenities
- id, listingId, wifi, parking, washingMachine, ac, fridge, kitchen, lift, gym, security, powerBackup, waterSupply, cctv

### Photos
- id, listingId, url, isPrimary, order

### RoomSharing
- id, listingId, genderRequired, minAge, maxAge, occupationPref, smoking, drinking, vegOnly, petsAllowed, currentOccupants, totalRooms

### HostelSharing
- id, listingId, genderRequired, minAge, maxAge, smoking, drinking, vegOnly, petsAllowed

### HostelSharingTier
- id, hostelSharingId, sharingSize, price, available

### Requests
- id, listingId, tenantId, status (PENDING/ACCEPTED/REJECTED), message, createdAt

### SavedListings
- id, userId, listingId

### Reviews
- id, listingId (optional), reviewerId, receiverId, rating (1-5), comment, createdAt

### Reports
- id, listingId, reporterId, reason, details, status, createdAt

### Chats
- id, ownerId, tenantId, listingId

### Messages
- id, chatId, senderId, content, image, seen, createdAt

### Notifications
- id, userId, title, body, type, data, read, createdAt

---

## Tech Stack

### Frontend
- React 19 + Vite 8
- React Router 7
- TanStack React Query 5
- Tailwind CSS 3
- Lucide React icons
- Leaflet + React-Leaflet (maps)
- Socket.io-client (chat)
- react-hot-toast

### Backend
- Node.js + Express 5
- Prisma ORM 6
- PostgreSQL
- JWT (access + refresh tokens)
- bcryptjs
- Cloudinary (image storage)
- multer + multer-storage-cloudinary
- Socket.io (realtime)
- Firebase Cloud Messaging (push notifications)

### Search
- PostgreSQL full-text search
- AI-assisted natural language query parser

### Maps
- OpenStreetMap + Leaflet
- Overpass API (nearby places)
- Geoapify (autocomplete)

---

## Development Status

### Phase 1 - Core Platform ✅
- User authentication (JWT)
- Rental listings (CRUD)
- Room sharing listings
- Hostel/PG listings with tiers
- Maps & photos
- Request/accept flow
- Contact reveal
- Search & filters (including address search)

### Phase 2 - User Experience ✅
- Saved listings
- Real-time chat (Socket.io)
- Ratings & reviews (with duplicate prevention)
- Nearby places (Overpass API)
- Push notifications (FCM)
- Report system
- Image compression before upload

### Phase 3 - Intelligence & Growth ✅
- AI search
- Analytics dashboards
- Admin moderation tools
- PWA support
- Mobile-responsive design

---

## Key Features Implemented

1. **Three listing types**: House Rental, Room Sharing, Hostel/PG
2. **Hostel sharing tiers**: Dynamic add/remove with price & availability
3. **Role-based listing creation**: Owners create all types, Tenants create Room Sharing only
4. **Review system**: User-to-user with duplicate prevention
5. **Image gallery**: Prev/next navigation with thumbnails
6. **City search**: Matches both city field and address field
7. **Image compression**: Client-side before upload
8. **Status management**: Active/Paused/Booked toggle
9. **Real-time chat**: Socket.io
10. **PWA**: Service worker + manifest
