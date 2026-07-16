# Quikden — Complete Product Plan & Documentation

## Goal

India's easiest platform to:
- Find rental houses
- Find roommates & hostel/PG accommodation
- List houses, rooms, or hostels for rent
- Build trust between owners and tenants via reviews
- Communicate safely via in-app chat
- Explore nearby facilities via maps
- Search naturally using AI
- Report fake or problematic listings

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 19.2.7 | UI framework |
| Vite | 8.1.1 | Build tool & dev server |
| React Router DOM | 7.18.1 | Client-side routing |
| TanStack React Query | 5.101.2 | Server state management, caching, pagination |
| Axios | 1.18.1 | HTTP client with interceptors |
| Tailwind CSS | 3.4.19 | Utility-first CSS |
| Lucide React | 1.24.0 | Icon library |
| Leaflet + React-Leaflet | 1.9.4 / 5.0.0 | Interactive maps |
| MapLibre GL JS | 5.24.0 | Map rendering |
| Socket.io-client | 4.8.3 | Real-time chat |
| react-hot-toast | 2.6.0 | Toast notifications |
| oxlint | 1.71.0 | Linting |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Node.js | >=18 | Runtime |
| Express | 5.2.1 | Web framework (v5) |
| Prisma | 6.19.3 | ORM |
| PostgreSQL | — | Database (via Supabase/Neon) |
| jsonwebtoken | 9.0.3 | JWT access + refresh tokens |
| bcryptjs | 3.0.3 | Password hashing (12 rounds) |
| Cloudinary | 1.41.3 | Image storage & optimization |
| multer | 2.2.0 | File upload handling |
| Socket.io | 4.8.3 | Real-time messaging |
| Firebase Admin | — | FCM push notifications |
| web-push | 3.6.7 | VAPID web push (PWA) |
| express-validator | 7.3.2 | Request validation |
| cookie-parser | — | Cookie handling |
| cors | — | Cross-origin resource sharing |

### Search & AI
- PostgreSQL full-text search (`ILIKE` across title, description, address, city)
- OpenRouter API (free LLM models, default: `mistralai/mistral-7b-instruct:free`)
- In-memory query cache for parsed AI queries
- Fallback simple regex-based parser when AI unavailable
- Handles 30+ Indian cities, 50+ neighborhoods, budget extraction, gender, type, BHK, amenities

### Maps & Location
- OpenStreetMap + Leaflet (interactive maps)
- Overpass API (nearby places: hospitals, schools, colleges, metro, bus, gym, restaurants, grocery, ATMs)
- Geoapify (address autocomplete)
- Location privacy: HOUSE_RENTAL listings get ~500m random offset for non-owners/non-admins/non-accepted-tenants

### Deployment
- **Frontend:** Vercel (React SPA with rewrite rules)
- **Backend:** Render (`https://roomiee.onrender.com/api`)
- **Database:** Supabase PostgreSQL (via connection pooler)
- **Images:** Cloudinary (auto-compressed: 1200x800, auto quality, JPG)

---

## User Roles & Permissions

### 1. Guest (No Auth)
| Can Do | Cannot Do |
|--------|-----------|
| Browse all listings (house, room, hostel, land) | Chat, save, send requests |
| Use filters & search (city, budget, type, etc.) | Contact owners |
| View photos, maps, nearby places | Report listings |
| Read reviews | Rate users |
| View user profiles | Create listings |
| Use AI natural language search | Access dashboard |
| Get VAPID public key | View notifications |

### 2. Tenant
| Can Do | Cannot Do |
|--------|-----------|
| Everything Guest can do | Create House Rental, Hostel, or Land listings |
| Save/unsave listings | Delete other users' listings |
| Send rental/roommate requests | Accept/reject requests (not their role) |
| Chat with owners (after request accepted) | Access admin panel |
| Create Room Sharing listings (find roommates) | |
| Create listings from accepted bookings (subletting) | |
| Report listings | |
| Rate owners (1-5 stars + comment) | |
| View accepted contact numbers | |
| View accepted bookings | |
| Update own profile | |
| View notifications | |
| Mark notifications read | |
| Delete own listings | |

### 3. Owner
| Can Do | Cannot Do |
|--------|-----------|
| Everything Guest can do | Delete other owners' listings |
| Create all listing types (House, Room, Hostel, Land) | Self-register as Admin |
| Edit own listings | |
| Delete own listings (+ Cloudinary cleanup) | |
| Accept/reject rental requests | |
| Chat with tenants | |
| View ratings & reviews | |
| Rate tenants | |
| Manage listing status (Active/Paused/Rented) | |
| View analytics dashboard | |
| Upload listing photos (max 10) | |
| View incoming requests | |
| View notifications | |
| Send welcome notifications | |

### 4. Admin
| Can Do | Cannot Do |
|--------|-----------|
| View all users with listing/request counts | Self-registration (must be assigned via DB) |
| Ban/unban users (with notification) | Create listings |
| View all listings | Send messages |
| Verify listings (set to ACTIVE) | |
| View analytics (users, listings, requests, reports) | |
| List all reports | |
| Update report status (Open/Resolved/Dismissed) | |
| Remove fake listings | |
| Handle abuse | |

---

## Pages & Routes

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Hero, search, popular cities, featured listings, how it works, stats |
| `/search` | SearchPage | Full search with filters sidebar, AI search toggle, paginated results |
| `/listing/:id` | ListingDetail | House rental: gallery, amenities, map, nearby, reviews, request/save/share/report |
| `/room/:id` | RoomDetail | Room sharing: gallery, roommate preferences, rules, map, nearby, reviews |
| `/hostel/:id` | HostelDetail | Hostel/PG: gallery, sharing tiers, house rules, map, nearby, reviews |
| `/land/:id` | LandDetail | Land listing detail |
| `/login` | LoginPage | Split-layout login with branding panel |
| `/register` | RegisterPage | Registration with Tenant/Owner role toggle |

### Protected Dashboard Routes
| Route | Page | Role |
|-------|------|------|
| `/dashboard` | DashboardRedirect | All (auto-redirects by role) |
| `/dashboard/tenant` | TenantDashboard | TENANT |
| `/dashboard/owner` | OwnerDashboard | OWNER |
| `/dashboard/my-listings` | MyListingsPage | TENANT |
| `/dashboard/listings` | MyListingsPage | OWNER |
| `/dashboard/listings/new` | CreateListing | OWNER, TENANT |
| `/dashboard/listings/:id/edit` | CreateListing (edit) | OWNER, TENANT |
| `/dashboard/saved` | SavedPage | TENANT |
| `/dashboard/requests` | RequestsPage | TENANT, OWNER |
| `/dashboard/chats` | ChatPage | TENANT, OWNER |
| `/dashboard/chats/:id` | ChatPage (active chat) | TENANT, OWNER |
| `/dashboard/profile` | ProfilePage | TENANT, OWNER |
| `/dashboard/analytics` | AnalyticsPage | OWNER |

### Admin Routes
| Route | Page | Role |
|-------|------|------|
| `/admin/*` | AdminDashboard (tabs: Overview, Users, Listings, Reports) | ADMIN |

---

## API Endpoints (Complete Reference)

### Health & Debug
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Health check |
| GET | `/api/ping` | None | Debug info (origin, host, env) |

### Authentication (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register (TENANT or OWNER). Returns JWT tokens. |
| POST | `/api/auth/login` | None | Login. Checks if banned. Returns JWT tokens. |
| POST | `/api/auth/refresh` | Cookie/body | Rotate refresh token. |
| POST | `/api/auth/logout` | None | Delete refresh token, clear cookies. |
| GET | `/api/auth/me` | Yes | Current user profile. |
| PATCH | `/api/auth/fcm-token` | Yes | Update FCM token for push notifications. |

### Users (`/api/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:id` | None | Public user profile (name, image, bio, rating, listing count). |
| PATCH | `/api/users/me` | Yes | Update own profile (name, phone, bio). |

### Listings (`/api/listings`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/listings/` | Optional | Any | List with filters + pagination. |
| GET | `/api/listings/owner/me` | Yes | Owner/Tenant/Admin | Owner's own listings. |
| GET | `/api/listings/tenant/bookings` | Yes | Tenant | Accepted booking listings. |
| POST | `/api/listings/from-booking` | Yes | Tenant | Create ROOM_SHARING from accepted booking. |
| GET | `/api/listings/:id` | Optional | Any | Listing detail with reviews, saved state. Increments views. |
| POST | `/api/listings/` | Yes | Owner/Tenant | Create listing (any type). Supports amenities, roomSharing, hostelSharing. |
| PUT | `/api/listings/:id` | Yes | Owner/Tenant/Admin | Update listing. Handles nested model upserts. |
| PATCH | `/api/listings/:id/status` | Yes | Owner/Tenant/Admin | Update status (ACTIVE/PAUSED/RENTED). |
| DELETE | `/api/listings/:id` | Yes | Owner/Admin | Delete listing + Cloudinary photos. |

### Search (`/api/search`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search/` | None | Full-text + filter search with pagination. |
| POST | `/api/search/ai` | None | AI natural language search. Parses free text into structured filters. |

**Search Filters:** `q` (text), `type`, `city`, `minRent`, `maxRent`, `furnished`, `gender`, `bedrooms`, `amenities` (comma-separated), `page`, `limit`

### Requests (`/api/requests`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/api/requests/` | Yes | Any | List requests (owner sees incoming, tenant sees outgoing). |
| POST | `/api/requests/` | Yes | Tenant | Send request. Validates ACTIVE listing, prevents self-request. |
| PATCH | `/api/requests/:id` | Yes | Owner/Tenant-host | Accept or reject. Accept creates Chat atomically. |
| GET | `/api/requests/:id/contact` | Yes | Tenant | Reveal owner phone after acceptance. |

### Chats (`/api/chats`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/chats/` | Yes | List chats with last message preview + unread count. |
| GET | `/api/chats/:id/messages` | Yes | Paginated messages (auto-marks seen). |
| POST | `/api/chats/:id/messages` | Yes | Send message (REST fallback for Socket.io). |

### Saved Listings (`/api/saved`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/saved/` | Yes | Get all saved listings with details. |
| POST | `/api/saved/:listingId` | Yes | Save a listing. |
| DELETE | `/api/saved/:listingId` | Yes | Unsave a listing. |

### Reviews (`/api/reviews`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reviews/:userId` | None | Get reviews received by a user. |
| POST | `/api/reviews/` | Yes | Create review (1-5 stars + comment). Prevents self-review and duplicates. |

### Reports (`/api/reports`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/api/reports/` | Yes | Any | Report a listing (8 reasons). |
| GET | `/api/reports/` | Yes | Admin | List all reports with listing + reporter info. |
| PATCH | `/api/reports/:id` | Yes | Admin | Update report status (Open/Resolved/Dismissed). |

**Report Reasons:** `FAKE_LISTING`, `WRONG_PRICE`, `ALREADY_RENTED`, `SPAM`, `DUPLICATE`, `WRONG_LOCATION`, `SCAM`, `OTHER`

### Upload (`/api/upload`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/api/upload/listing-photos/:listingId` | Yes | Owner | Upload up to 10 images. Compressed via Cloudinary. |
| DELETE | `/api/upload/photos/:photoId` | Yes | Owner of listing | Delete photo from Cloudinary + DB. |
| POST | `/api/upload/profile` | Yes | Any | Upload profile photo (face-cropped 400x400). |

### Notifications (`/api/notifications`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/` | Yes | Get latest 50 notifications. |
| PATCH | `/api/notifications/read-all` | Yes | Mark all as read. |
| PATCH | `/api/notifications/:id/read` | Yes | Mark one as read. |

**Notification Types:** `NEW_REQUEST`, `REQUEST_ACCEPTED`, `REQUEST_REJECTED`, `NEW_MESSAGE`, `NEW_REVIEW`, `ACCOUNT_BANNED`, `LISTING_VERIFIED`

### Admin (`/api/admin`) — All require ADMIN role
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List all users with listing/request counts. |
| PATCH | `/api/admin/users/:id/ban` | Ban or unban user (sends notification). |
| GET | `/api/admin/listings` | List all listings with owner info. |
| PATCH | `/api/admin/listings/:id/verify` | Verify listing (set ACTIVE, notify owner). |
| GET | `/api/admin/analytics` | Dashboard counts (users, listings, requests, reports). |

### Push Notifications (`/api/push`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/push/vapid-public-key` | None | Get VAPID public key for web-push. |
| POST | `/api/push/subscribe` | Yes | Subscribe to web push (endpoint, p256dh, auth). |
| POST | `/api/push/unsubscribe` | Yes | Unsubscribe from push. |
| POST | `/api/push/welcome` | Yes | Send staggered welcome notifications (immediate, 30s, 2min). |

### Socket.io Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join_chat` | Client→Server | Join chat room |
| `leave_chat` | Client→Server | Leave chat room |
| `send_message` | Client→Server | Send message (with callback) |
| `typing` | Client→Server | Typing indicator |
| `mark_seen` | Client→Server | Mark messages as seen |
| `new_message` | Server→Client | Receive new message |
| `user_typing` | Server→Client | Other user typing |
| `messages_seen` | Server→Client | Messages marked seen |

---

## Features (Detailed)

### 1. Authentication & Authorization
- JWT access token (15min) + refresh token (7 days)
- Refresh token rotation (old deleted, new issued)
- Refresh tokens stored in DB (server-side revocation)
- Password hashing with bcrypt (12 rounds)
- Optional auth middleware (attaches user if token present, continues as guest if not)
- Banned user detection (blocks login and API access)
- FCM token storage for push notifications
- HttpOnly cookie support for tokens

### 2. Listings (4 Types)
- **House Rental** (`HOUSE_RENTAL`): Full house/apartment for rent
- **Room Sharing** (`ROOM_SHARING`): Find flatmates/roommates
- **Hostel/PG** (`HOSTEL`): Paying guest with multiple sharing tiers
- **Land Sale** (`LAND_SALE`): Plots/land for purchase

Each listing includes:
- Title, description, rent, deposit, maintenance
- Address with city, state, pincode
- Latitude/longitude coordinates
- Bedrooms, bathrooms, balcony, parking
- Area in sqft, furnished status, available from date
- View counter (fire-and-forget increment)

### 3. Nested Listing Models

**Amenities (12 boolean flags):**
`wifi`, `parking`, `washingMachine`, `ac`, `fridge`, `kitchen`, `lift`, `gym`, `security`, `powerBackup`, `waterSupply`, `cctv`

**Room Sharing Preferences:**
- Gender required (MALE/FEMALE/ANY)
- Age range (min/max)
- Occupation preference (STUDENT/PROFESSIONAL/ANY)
- Habits: smoking, drinking, veg only, pets allowed
- Current occupants, total rooms

**Hostel Sharing Preferences:**
- Gender required, age range, habits
- **Sharing Tiers** (dynamic): sharing size (2/3/4/1), price per month, availability toggle

### 4. Image Handling
- Cloudinary integration for all image storage
- **Listing photos:** Up to 10, compressed (1200x800, auto quality, JPG)
- **Profile photos:** Face-crop (400x400, gravity: face)
- Client-side compression before upload (canvas API: 1200x900px, JPEG quality 0.8)
- Photo ordering with primary photo designation
- Cloudinary cleanup on listing/photo deletion
- Image gallery: full-width main image, prev/next arrows, thumbnail strip, photo counter

### 5. Search & AI
- **Full-text search:** Across title, description, address, city (PostgreSQL `ILIKE`)
- **Structured filters:** City, budget range, type, gender, bedrooms, furnished, amenities
- **Pagination:** Configurable page/limit
- **AI natural language search:**
  - Free-text queries like "2bhk near Delhi University under 15000"
  - Parses into structured filters + keywords via OpenRouter LLM
  - Progressive fallback: text+filters → filters only → loose city+budget
  - In-memory query cache (reduces API calls)
  - Comprehensive fallback parser (30+ Indian cities, 50+ neighborhoods, budget, gender, type, BHK, amenities)

### 6. Maps & Location
- Leaflet/OpenStreetMap integration
- Location picker for listing creation
- **Nearby places** via Overpass API:
  - Hospitals, schools, colleges
  - Metro stations, bus stops
  - Gyms, restaurants, grocery stores
  - ATMs, petrol pumps, medical shops
- **Location privacy:** HOUSE_RENTAL listings get ~500m random offset for non-owners/non-admins/non-accepted-tenants
- `isLocationExact` flag returned to client

### 7. Request/Accept Flow
1. Tenant sends request → Owner gets notification
2. Owner accepts → Chat atomically created → Tenant notified → Phone revealed
3. Owner rejects → Tenant notified with status update
4. Tenant can view accepted contact numbers
5. Unique constraint: one request per tenant per listing

### 8. Real-time Chat
- Socket.io-powered messaging with JWT auth middleware
- Text + image messages
- Chat rooms (join/leave events)
- Typing indicators
- Message read tracking (auto-mark seen on message fetch)
- Unread message count per chat
- Notification on new message (in-app + push)
- Listing status check: messaging disabled if listing not ACTIVE
- REST API fallback for message sending

### 9. Reviews & Ratings
- 1-5 star rating with optional comment
- Optional listing association
- Duplicate prevention (same reviewer + receiver + listing)
- Self-review prevention
- Auto-updated user average rating and total ratings
- Notification to review receiver
- Displayed on: ListingDetail, HostelDetail, RoomDetail, ProfilePage

### 10. Saved Listings (Wishlist)
- Save/unsave toggle per listing
- Get all saved listings with full listing details
- Displayed on tenant's Saved page

### 11. Reports
- Report a listing with reason enum (8 reasons)
- Admin dashboard: list reports, update status
- Duplicate reports from same user allowed (no constraint)

### 12. Notifications
- **In-app notifications** (stored in DB, max 50 returned)
- **FCM push notifications** (when Firebase configured)
- **Web push (VAPID)** for PWA
- **Notification types:**
  - `NEW_REQUEST` — Owner notified of new request
  - `REQUEST_ACCEPTED` — Tenant notified of acceptance
  - `REQUEST_REJECTED` — Tenant notified of rejection
  - `NEW_MESSAGE` — Chat participant notified
  - `NEW_REVIEW` — Review receiver notified
  - `ACCOUNT_BANNED` — User notified of ban
  - `LISTING_VERIFIED` — Owner notified of verification
- Mark read (single or bulk)
- Staggered welcome notification sequence (immediate, 30s, 2min)

### 13. Admin Panel
- **User management:** List all users with listing/request counts, ban/unban with notification
- **Listing management:** List all listings with owner info, verify listings (set ACTIVE)
- **Reports:** List all reports, update status (Open/Resolved/Dismissed)
- **Analytics:** Dashboard counts (total users, active listings, total requests, open reports)

### 14. Profile Management
- Edit name, phone, bio
- Profile photo upload (face-cropped via Cloudinary)
- Public user profile (name, image, bio, rating, listing count, review count)
- Average rating auto-calculated from reviews

### 15. Listing Status Management
- **ACTIVE:** Visible in search, accepting requests
- **PAUSED:** Not visible in search, not accepting requests
- **RENTED:** Visible but shows "Booked" badge
- Owner can cycle status from My Listings page

### 16. Booking-to-Listing (Subletting)
- Tenant creates ROOM_SHARING listing from accepted booking
- Copies address/location from original listing
- Enables subletting and roommate finding

### 17. PWA Support
- Service worker for offline caching
- manifest.json for installability
- Installable on mobile devices
- Web push notifications via VAPID

### 18. Error Handling
- Custom `AppError` class with operational flag
- Prisma error translation (P2002 unique, P2025 not found, P2003 foreign key)
- JWT error handling (invalid, expired)
- Global error middleware
- Async handler wrapper (eliminates try/catch boilerplate)

---

## Database Schema (16 Tables)

### Users
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | |
| email | String (unique) | |
| phone | String? | |
| password | String | bcrypt hashed |
| role | Enum | GUEST, TENANT, OWNER, ADMIN |
| avgRating | Float | Auto-calculated |
| totalRatings | Int | Auto-calculated |
| profileImage | String? | Cloudinary URL |
| bio | String? | |
| isVerified | Boolean | Default false |
| isBanned | Boolean | Default false |
| fcmToken | String? | Firebase Cloud Messaging |
| createdAt | DateTime | |

### Refresh Tokens
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| token | String (unique) | JWT refresh token |
| userId | String | FK → Users |
| expiresAt | DateTime | |

### Listings
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| ownerId | String | FK → Users |
| title | String | |
| description | String | |
| type | Enum | HOUSE_RENTAL, ROOM_SHARING, HOSTEL, LAND_SALE |
| status | Enum | ACTIVE, RENTED, PAUSED, DELETED |
| rent | Int | Monthly rent in INR |
| deposit | Int? | Security deposit |
| maintenance | Int? | Maintenance charges |
| address | String | Full address |
| city | String | Indexed |
| state | String | |
| pincode | String | |
| latitude | Float | Indexed |
| longitude | Float | Indexed |
| bedrooms | Int? | |
| bathrooms | Int? | |
| balcony | Boolean? | |
| parking | Boolean? | |
| areaSqFt | Int? | |
| furnished | Boolean? | |
| availableFrom | DateTime? | |
| views | Int | Default 0, fire-and-forget increment |
| createdAt | DateTime | |

### Amenities
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String (unique) | FK → Listings |
| wifi | Boolean | |
| parking | Boolean | |
| washingMachine | Boolean | |
| ac | Boolean | |
| fridge | Boolean | |
| kitchen | Boolean | |
| lift | Boolean | |
| gym | Boolean | |
| security | Boolean | |
| powerBackup | Boolean | |
| waterSupply | Boolean | |
| cctv | Boolean | |

### Photos
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String | FK → Listings |
| url | String | Cloudinary URL |
| publicId | String | Cloudinary public ID |
| isPrimary | Boolean | |
| order | Int | |

### Room Sharing
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String (unique) | FK → Listings |
| genderRequired | Enum | MALE, FEMALE, ANY |
| minAge | Int? | |
| maxAge | Int? | |
| occupationPref | Enum | STUDENT, PROFESSIONAL, ANY |
| smoking | Boolean | |
| drinking | Boolean | |
| vegOnly | Boolean | |
| petsAllowed | Boolean | |
| currentOccupants | Int? | |
| totalRooms | Int? | |

### Hostel Sharing
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String (unique) | FK → Listings |
| genderRequired | Enum | |
| minAge | Int? | |
| maxAge | Int? | |
| smoking | Boolean | |
| drinking | Boolean | |
| vegOnly | Boolean | |
| petsAllowed | Boolean | |

### Hostel Sharing Tiers
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| hostelSharingId | String | FK → HostelSharing |
| sharingSize | Int | 1, 2, 3, 4, etc. |
| price | Int | Monthly price |
| available | Boolean | |

### Requests
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String | FK → Listings |
| tenantId | String | FK → Users |
| status | Enum | PENDING, ACCEPTED, REJECTED |
| message | String? | Tenant's message to owner |
| createdAt | DateTime | |
| | | Unique: [listingId, tenantId] |

### Saved Listings
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| userId | String | FK → Users |
| listingId | String | FK → Listings |
| | | Unique: [userId, listingId] |

### Chats
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| ownerId | String | FK → Users |
| tenantId | String | FK → Users |
| listingId | String | FK → Listings |
| requestId | String (unique) | FK → Requests |

### Messages
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| chatId | String | FK → Chats (indexed) |
| senderId | String | FK → Users |
| content | String | |
| imageUrl | String? | |
| seen | Boolean | Default false |
| createdAt | DateTime | |

### Reviews
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String? | FK → Listings (optional) |
| reviewerId | String | FK → Users |
| receiverId | String | FK → Users |
| rating | Int | 1-5 |
| comment | String? | |
| createdAt | DateTime | |
| | | Unique: [reviewerId, receiverId, listingId] |

### Reports
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| listingId | String | FK → Listings |
| reporterId | String | FK → Users |
| reason | Enum | FAKE_LISTING, WRONG_PRICE, ALREADY_RENTED, SPAM, DUPLICATE, WRONG_LOCATION, SCAM, OTHER |
| details | String? | |
| status | Enum | OPEN, RESOLVED, DISMISSED |
| createdAt | DateTime | |

### Notifications
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| userId | String | FK → Users (indexed) |
| title | String | |
| body | String | |
| type | String | NEW_REQUEST, REQUEST_ACCEPTED, etc. |
| data | JSON? | Additional metadata |
| read | Boolean | Default false |
| createdAt | DateTime | |

### Push Subscriptions
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | |
| userId | String | FK → Users (indexed) |
| endpoint | String (unique) | Push service endpoint |
| p256dh | String | Encryption key |
| auth | String | Auth secret |

---

## Development Status

### Phase 1 — Core Platform ✅
- User authentication (JWT access + refresh tokens)
- Rental listings CRUD (House, Room, Hostel)
- Maps & photos (Leaflet, Cloudinary)
- Request/accept flow (with transactional chat creation)
- Contact reveal (phone visible after acceptance)
- Search & filters (city, budget, type, amenities)
- Database schema with Prisma ORM

### Phase 2 — User Experience ✅
- Saved listings (wishlist)
- Real-time chat (Socket.io with typing, seen, unread)
- Ratings & reviews (duplicate prevention, auto-aggregation)
- Nearby places (Overpass API: hospitals, schools, metro, etc.)
- Push notifications (FCM + Web Push VAPID)
- Report system (8 reasons, admin moderation)
- Image compression before upload (canvas API)
- Location privacy (blur for non-owners)

### Phase 3 — Intelligence & Growth ✅
- AI natural language search (OpenRouter LLM + fallback parser)
- Analytics dashboards (owner + admin)
- Admin moderation tools (ban, verify, reports)
- PWA support (service worker, manifest, installable)
- Mobile-responsive design
- Booking-to-listing (subletting feature)
- Staggered welcome notifications

---

## Known Bugs (Found During QA Testing)

### BUG 1 — Update listing returns 500 (P0)
**File:** `backend/src/controllers/listing.controller.js:298`
**Issue:** When `availableFrom` is not provided in update body, it defaults to `null`, but the schema field is non-nullable.
**Fix:** Only include `availableFrom` when explicitly provided.

### BUG 2 — Create listing from booking returns 500 (P0)
**File:** `backend/src/controllers/listing.controller.js:426`
**Issue:** Same `availableFrom` null issue as BUG 1.
**Fix:** Same fix as BUG 1.

### BUG 3 — Duplicate save not idempotent (P2)
**File:** `backend/src/controllers/saved.controller.js:12`
**Issue:** Second save throws 409 "Duplicate value" instead of being idempotent.
**Fix:** Check for existing save or use upsert.

### BUG 4 — Accept already-processed request errors (P2)
**File:** `backend/src/controllers/request.controller.js:56`
**Issue:** Re-accepting an accepted request returns "Request already processed" instead of being idempotent.
**Fix:** Return current state instead of throwing.

### BUG 5 — Duplicate reports allowed (P2)
**File:** `backend/prisma/schema.prisma` (Report model)
**Issue:** No unique constraint on `(listingId, reporterId)`.
**Fix:** Add `@@unique([listingId, reporterId])` to Report model.

### BUG 6 — Admin role can be silently downgraded (P1)
**File:** `backend/src/controllers/auth.controller.js:46-54`
**Issue:** Registration with role=ADMIN silently downgrades to TENANT instead of rejecting.
**Fix:** Explicitly reject non-TENANT/OWNER roles with 403.

---

## Test Results (QA Run — July 16, 2026)

| Role | Passed | Failed | Skipped | Total |
|------|--------|--------|---------|-------|
| Guest | 19 | 0 | 3 | 22 |
| Owner | 18 | 1 | 1 | 20 |
| Tenant | 29 | 1 | 1 | 31 |
| Admin | 7 | 0 | 0 | 7 |
| Edge Cases | 12 | 1 | 0 | 13 |
| **Total** | **85** | **3** | **5** | **93** |

**Note:** 3 failures are backend bugs (listed above). 5 skips are due to test ordering dependencies.
