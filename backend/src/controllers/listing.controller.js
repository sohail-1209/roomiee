// Listing controller — CRUD for house rentals + room sharing
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const cloudinary = require('../services/cloudinary.service');
const cache = require('../utils/cache');

// ─── Shared listing select (reused in list + detail) ──
const listingSelect = {
  id: true,
  ownerId: true,
  title: true,
  type: true,
  status: true,
  rent: true,
  deposit: true,
  maintenance: true,
  address: true,
  city: true,
  state: true,
  latitude: true,
  longitude: true,
  bedrooms: true,
  bathrooms: true,
  balcony: true,
  parking: true,
  areaSqFt: true,
  furnished: true,
  availableFrom: true,
  views: true,
  createdAt: true,
  owner: {
    select: {
      id: true, name: true, profileImage: true,
      avgRating: true, totalRatings: true, isVerified: true,
    },
  },
  amenities: true,
  photos: { orderBy: { order: 'asc' } },
  roomSharing: true,
  hostelSharing: { include: { tiers: true } },
  _count: { select: { savedBy: true, reviews: true, requests: true } },
};

// Optimized listing select for list feeds (e.g. search, lists, homepage)
const listingFeedSelect = {
  id: true,
  ownerId: true,
  title: true,
  type: true,
  status: true,
  rent: true,
  deposit: true,
  address: true,
  city: true,
  bedrooms: true,
  bathrooms: true,
  areaSqFt: true,
  availableFrom: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      profileImage: true,
      avgRating: true,
    },
  },
  photos: {
    select: { url: true, isPrimary: true },
    orderBy: { order: 'asc' },
  },
  roomSharing: {
    select: { genderRequired: true },
  },
  hostelSharing: {
    select: {
      tiers: {
        select: { id: true, sharingSize: true, price: true, available: true },
      },
    },
  },
};

// ─── GET /listings — list with filters + pagination ───
const getListings = asyncHandler(async (req, res) => {
  const {
    type, city, minRent, maxRent, furnished, gender,
    bedrooms, parking, wifi, ac, fridge, pg, page = 1, limit = 12,
  } = req.query;

  const cacheKey = `listings:${JSON.stringify(req.query)}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const where = {
    status: { in: ['ACTIVE', 'RENTED'] },
    ...(type && { type }),
    ...(city && {
      OR: [
        { city: { contains: city, mode: 'insensitive' } },
        { address: { contains: city, mode: 'insensitive' } },
      ],
    }),
    ...(minRent && { rent: { gte: parseInt(minRent) } }),
    ...(maxRent && { rent: { lte: parseInt(maxRent) } }),
    ...(furnished !== undefined && { furnished: furnished === 'true' }),
    ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
    ...(parking !== undefined && { parking: parking === 'true' }),
  };

  // Amenity filters
  const amenityWhere = {};
  if (wifi === 'true') amenityWhere.wifi = true;
  if (ac === 'true') amenityWhere.ac = true;
  if (fridge === 'true') amenityWhere.fridge = true;
  if (Object.keys(amenityWhere).length > 0) where.amenities = amenityWhere;

  // Gender filter (room sharing only)
  if (gender) where.roomSharing = { genderRequired: { in: [gender, 'ANY'] } };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: listingFeedSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.listing.count({ where }),
  ]);

  const responseData = {
    success: true,
    data: listings,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  };

  cache.set(cacheKey, responseData, 30);
  res.json(responseData);
});

// ─── GET /listings/:id — single listing detail ────────
const getListing = asyncHandler(async (req, res) => {
  const listingId = req.params.id;

  // 1. Get raw listing details (from cache or database)
  const cacheKey = `listing:${listingId}`;
  let listing = cache.get(cacheKey);

  if (!listing) {
    listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        ...listingSelect,
        description: true,
        pincode: true,
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, profileImage: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!listing) throw new AppError('Listing not found', 404);

    // Save raw details to cache for 30s
    cache.set(cacheKey, listing, 30);
  }

  // Increment views (fire and forget)
  prisma.listing.update({ where: { id: listingId }, data: { views: { increment: 1 } } }).catch(() => {});

  // 2. Fetch user-specific status in parallel if authenticated
  let isSaved = false;
  let hasAcceptedRequest = false;

  if (req.user) {
    const [saved, acceptedRequest] = await Promise.all([
      prisma.savedListing.findUnique({
        where: { userId_listingId: { userId: req.user.id, listingId } },
      }),
      prisma.request.findFirst({
        where: { listingId, tenantId: req.user.id, status: 'ACCEPTED' },
      }),
    ]);
    isSaved = !!saved;
    hasAcceptedRequest = !!acceptedRequest;
  }

  // Blur location for house rentals unless owner or has accepted request
  let { latitude, longitude } = listing;
  const isOwner = req.user && listing.ownerId === req.user.id;
  const isAdmin = req.user && req.user.role === 'ADMIN';
  if (listing.type === 'HOUSE_RENTAL' && !isOwner && !isAdmin && !hasAcceptedRequest) {
    // Add random offset up to ~0.005 degrees (~500m)
    const offset = () => (Math.random() - 0.5) * 0.01;
    latitude = listing.latitude + offset();
    longitude = listing.longitude + offset();
  }

  res.json({
    success: true,
    data: { 
      ...listing, 
      latitude, 
      longitude, 
      isSaved, 
      isLocationExact: listing.type !== 'HOUSE_RENTAL' || isOwner || isAdmin || hasAcceptedRequest 
    },
  });
});

// ─── Helper: parse availableFrom safely ──────────────
const parseAvailableFrom = (dateStr) => {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

// ─── Helper: clean amenities object matching Prisma model ───
const cleanAmenities = (amenitiesObj) => {
  if (!amenitiesObj) return undefined;
  const allowed = [
    'wifi', 'parking', 'washingMachine', 'ac', 'fridge', 
    'kitchen', 'lift', 'gym', 'security', 'powerBackup', 
    'waterSupply', 'cctv'
  ];
  const cleaned = {};
  allowed.forEach((field) => {
    if (amenitiesObj[field] !== undefined) {
      cleaned[field] = Boolean(amenitiesObj[field]);
    }
  });
  return cleaned;
};

// ─── POST /listings — create listing (owner only) ─────
const createListing = asyncHandler(async (req, res) => {
  const {
    title, description, type, rent, deposit, maintenance,
    address, city, state, pincode, latitude, longitude,
    bedrooms, bathrooms, balcony, parking, areaSqFt, furnished, availableFrom,
    amenities, roomSharing, hostelSharing,
  } = req.body;

  const listing = await prisma.listing.create({
    data: {
      ownerId: req.user.id,
      title, description, type, rent: parseInt(rent) || 0,
      deposit: parseInt(deposit) || 0, maintenance: parseInt(maintenance) || 0,
      address, city, state, pincode,
      latitude: parseFloat(latitude) || 0.0, longitude: parseFloat(longitude) || 0.0,
      bedrooms: parseInt(bedrooms) || 1, bathrooms: parseInt(bathrooms) || 1,
      balcony: Boolean(balcony), parking: Boolean(parking),
      areaSqFt: areaSqFt ? (parseInt(areaSqFt) || null) : null,
      furnished: Boolean(furnished),
      availableFrom: parseAvailableFrom(availableFrom),
      ...(amenities && {
        amenities: { create: cleanAmenities(amenities) },
      }),
      ...(roomSharing && type === 'ROOM_SHARING' && {
        roomSharing: {
          create: {
            genderRequired: roomSharing.genderRequired || 'ANY',
            minAge: roomSharing.minAge ? (parseInt(roomSharing.minAge) || null) : null,
            maxAge: roomSharing.maxAge ? (parseInt(roomSharing.maxAge) || null) : null,
            occupationPref: roomSharing.occupationPref || 'ANY',
            smoking: Boolean(roomSharing.smoking),
            drinking: Boolean(roomSharing.drinking),
            vegOnly: Boolean(roomSharing.vegOnly),
            petsAllowed: Boolean(roomSharing.petsAllowed),
            currentOccupants: parseInt(roomSharing.currentOccupants) || 0,
            totalRooms: parseInt(roomSharing.totalRooms) || 1,
          }
        },
      }),
      ...(hostelSharing && type === 'HOSTEL' && {
        hostelSharing: {
          create: {
            genderRequired: hostelSharing.genderRequired || 'ANY',
            minAge: hostelSharing.minAge ? (parseInt(hostelSharing.minAge) || null) : null,
            maxAge: hostelSharing.maxAge ? (parseInt(hostelSharing.maxAge) || null) : null,
            smoking: Boolean(hostelSharing.smoking),
            drinking: Boolean(hostelSharing.drinking),
            vegOnly: Boolean(hostelSharing.vegOnly),
            petsAllowed: Boolean(hostelSharing.petsAllowed),
            tiers: {
              create: (hostelSharing.tiers || []).map((t) => ({
                sharingSize: parseInt(t.sharingSize) || 2,
                price: parseInt(t.price) || 0,
                available: t.available !== false,
              })),
            },
          },
        },
      }),
    },
    include: { amenities: true, roomSharing: true, hostelSharing: { include: { tiers: true } } },
  });

  cache.clear();
  res.status(201).json({ success: true, data: listing });
});

// ─── PUT /listings/:id — update listing ───────────────
const updateListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'TENANT') {
    throw new AppError('Not authorized', 403);
  }

  const { amenities, roomSharing, hostelSharing, availableFrom, ...data } = req.body;

  // Cast numeric inputs in data
  if (data.rent !== undefined) data.rent = parseInt(data.rent) || 0;
  if (data.deposit !== undefined) data.deposit = parseInt(data.deposit) || 0;
  if (data.maintenance !== undefined) data.maintenance = parseInt(data.maintenance || 0) || 0;
  if (data.bedrooms !== undefined) data.bedrooms = parseInt(data.bedrooms) || 1;
  if (data.bathrooms !== undefined) data.bathrooms = parseInt(data.bathrooms) || 1;
  if (data.latitude !== undefined) data.latitude = parseFloat(data.latitude) || 0.0;
  if (data.longitude !== undefined) data.longitude = parseFloat(data.longitude) || 0.0;
  if (data.areaSqFt !== undefined) data.areaSqFt = data.areaSqFt ? (parseInt(data.areaSqFt) || null) : null;
  if (data.furnished !== undefined) data.furnished = Boolean(data.furnished);
  if (data.balcony !== undefined) data.balcony = Boolean(data.balcony);
  if (data.parking !== undefined) data.parking = Boolean(data.parking);

  // Parse amenities
  let amenitiesUpsert = undefined;
  if (amenities) {
    const amenitiesClean = cleanAmenities(amenities);
    amenitiesUpsert = { upsert: { create: amenitiesClean, update: amenitiesClean } };
  }

  // Parse roomSharing only if type is ROOM_SHARING
  let roomSharingUpsert = undefined;
  const activeType = data.type || listing.type;
  if (activeType === 'ROOM_SHARING' && roomSharing) {
    const roomSharingClean = {
      genderRequired: roomSharing.genderRequired || 'ANY',
      minAge: roomSharing.minAge ? (parseInt(roomSharing.minAge) || null) : null,
      maxAge: roomSharing.maxAge ? (parseInt(roomSharing.maxAge) || null) : null,
      smoking: Boolean(roomSharing.smoking),
      drinking: Boolean(roomSharing.drinking),
      vegOnly: Boolean(roomSharing.vegOnly),
      petsAllowed: Boolean(roomSharing.petsAllowed),
      currentOccupants: parseInt(roomSharing.currentOccupants) || 0,
      totalRooms: parseInt(roomSharing.totalRooms) || 1,
    };
    roomSharingUpsert = { upsert: { create: roomSharingClean, update: roomSharingClean } };
  } else if (activeType !== 'ROOM_SHARING') {
    await prisma.roomSharing.deleteMany({ where: { listingId: req.params.id } });
  }

  // Parse hostelSharing only if type is HOSTEL
  let hostelSharingUpsert = undefined;
  if (activeType === 'HOSTEL' && hostelSharing) {
    const hostelSharingClean = {
      genderRequired: hostelSharing.genderRequired || 'ANY',
      minAge: hostelSharing.minAge ? (parseInt(hostelSharing.minAge) || null) : null,
      maxAge: hostelSharing.maxAge ? (parseInt(hostelSharing.maxAge) || null) : null,
      smoking: Boolean(hostelSharing.smoking),
      drinking: Boolean(hostelSharing.drinking),
      vegOnly: Boolean(hostelSharing.vegOnly),
      petsAllowed: Boolean(hostelSharing.petsAllowed),
    };
    // Delete existing tiers and recreate
    await prisma.hostelSharingTier.deleteMany({
      where: { hostelSharing: { listingId: req.params.id } },
    });
    await prisma.hostelSharing.deleteMany({ where: { listingId: req.params.id } });
    hostelSharingUpsert = {
      create: {
        ...hostelSharingClean,
        tiers: {
          create: (hostelSharing.tiers || []).map((t) => ({
            sharingSize: parseInt(t.sharingSize) || 2,
            price: parseInt(t.price) || 0,
            available: t.available !== false,
          })),
        },
      },
    };
  } else if (activeType !== 'HOSTEL') {
    await prisma.hostelSharingTier.deleteMany({
      where: { hostelSharing: { listingId: req.params.id } },
    });
    await prisma.hostelSharing.deleteMany({ where: { listingId: req.params.id } });
  }

  const updated = await prisma.listing.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(req.body.availableFrom !== undefined && { availableFrom: parseAvailableFrom(req.body.availableFrom) }),
      ...(amenitiesUpsert && { amenities: amenitiesUpsert }),
      ...(roomSharingUpsert && { roomSharing: roomSharingUpsert }),
      ...(hostelSharingUpsert && { hostelSharing: hostelSharingUpsert }),
    },
    include: { amenities: true, roomSharing: true, hostelSharing: { include: { tiers: true } }, photos: true },
  });

  cache.clear();
  res.json({ success: true, data: updated });
});

// ─── DELETE /listings/:id ─────────────────────────────
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { photos: true },
  });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized', 403);
  }

  // Delete photos from Cloudinary
  for (const photo of listing.photos) {
    try {
      await cloudinary.uploader.destroy(photo.publicId);
    } catch (e) {
      console.warn('Failed to delete photo:', e.message);
    }
  }

  // Delete listing — all related records cascade via Prisma schema
  await prisma.listing.delete({ where: { id: listing.id } });
  cache.clear();
  res.json({ success: true, message: 'Listing deleted' });
});

// ─── PATCH /listings/:id/status — update listing status ──
const updateListingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['ACTIVE', 'PAUSED', 'RENTED'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status. Must be ACTIVE, PAUSED, or RENTED', 400);
  }

  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'TENANT') {
    throw new AppError('Not authorized', 403);
  }

  const updated = await prisma.listing.update({
    where: { id: req.params.id },
    data: { status },
  });

  cache.clear();
  res.json({ success: true, data: updated });
});

// ─── GET /listings/owner/me — owner's own listings ────
const getMyListings = asyncHandler(async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { ownerId: req.user.id, status: { not: 'DELETED' } },
    select: listingSelect,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: listings });
});

// ─── GET /listings/tenant/bookings — tenant's accepted bookings ──
const getMyBookings = asyncHandler(async (req, res) => {
  const requests = await prisma.request.findMany({
    where: { tenantId: req.user.id, status: 'ACCEPTED' },
    include: {
      listing: {
        select: {
          id: true, title: true, address: true, city: true, state: true, pincode: true,
          latitude: true, longitude: true, rent: true, deposit: true,
          type: true, bedrooms: true, bathrooms: true,
          photos: { where: { isPrimary: true }, take: 1 },
          owner: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: requests });
});

// ─── POST /listings/from-booking — create room sharing from accepted booking ──
const createFromBooking = asyncHandler(async (req, res) => {
  const { bookingId, title, description, rent, deposit, maintenance,
    bedrooms, bathrooms, balcony, parking, areaSqFt, furnished, availableFrom,
    amenities, roomSharing } = req.body;

  // Verify tenant has an accepted request on this listing
  const request = await prisma.request.findFirst({
    where: {
      listingId: bookingId,
      tenantId: req.user.id,
      status: 'ACCEPTED',
    },
  });
  if (!request) throw new AppError('No accepted booking found for this listing', 404);

  // Get original listing for location data
  const original = await prisma.listing.findUnique({ where: { id: bookingId } });
  if (!original) throw new AppError('Original listing not found', 404);

  const listing = await prisma.listing.create({
    data: {
      ownerId: req.user.id,
      title, description: description || '',
      type: 'ROOM_SHARING',
      rent: parseInt(rent),
      deposit: parseInt(deposit || 0),
      maintenance: parseInt(maintenance || 0),
      address: original.address,
      city: original.city,
      state: original.state,
      pincode: original.pincode,
      latitude: original.latitude,
      longitude: original.longitude,
      bedrooms: parseInt(bedrooms || 1),
      bathrooms: parseInt(bathrooms || 1),
      balcony: Boolean(balcony),
      parking: Boolean(parking),
      areaSqFt: areaSqFt ? parseInt(areaSqFt) : null,
      furnished: Boolean(furnished),
      ...(req.body.availableFrom !== undefined && { availableFrom: new Date(req.body.availableFrom) }),
      ...(amenities && { amenities: { create: amenities } }),
      ...(roomSharing && { roomSharing: { create: roomSharing } }),
    },
    include: { amenities: true, roomSharing: true },
  });

  res.status(201).json({ success: true, data: listing });
});

// ─── POST /listings/tenant/bookings/:id/complete — mark booking as completed ──
const completeBooking = asyncHandler(async (req, res) => {
  const request = await prisma.request.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.id,
      status: 'ACCEPTED',
    },
  });
  if (!request) throw new AppError('Booking not found', 404);

  await prisma.request.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED' },
  });

  res.json({ success: true });
});

module.exports = { getListings, getListing, createListing, updateListing, deleteListing, getMyListings, updateListingStatus, getMyBookings, createFromBooking, completeBooking };
