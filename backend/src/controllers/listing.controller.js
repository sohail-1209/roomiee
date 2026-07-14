// Listing controller — CRUD for house rentals + room sharing
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── Shared listing select (reused in list + detail) ──
const listingSelect = {
  id: true,
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
  _count: { select: { savedBy: true, reviews: true, requests: true } },
};

// ─── GET /listings — list with filters + pagination ───
const getListings = asyncHandler(async (req, res) => {
  const {
    type, city, minRent, maxRent, furnished, gender,
    bedrooms, parking, wifi, ac, fridge, pg, page = 1, limit = 12,
  } = req.query;

  const where = {
    status: 'ACTIVE',
    ...(type && { type }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
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
      select: listingSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({
    success: true,
    data: listings,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
});

// ─── GET /listings/:id — single listing detail ────────
const getListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
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

  // Increment views (fire and forget)
  prisma.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } }).catch(() => {});

  // If authenticated, check if saved
  let isSaved = false;
  if (req.user) {
    const saved = await prisma.savedListing.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId: listing.id } },
    });
    isSaved = !!saved;
  }

  res.json({ success: true, data: { ...listing, isSaved } });
});

// ─── POST /listings — create listing (owner only) ─────
const createListing = asyncHandler(async (req, res) => {
  const {
    title, description, type, rent, deposit, maintenance,
    address, city, state, pincode, latitude, longitude,
    bedrooms, bathrooms, balcony, parking, areaSqFt, furnished, availableFrom,
    amenities, roomSharing,
  } = req.body;

  const listing = await prisma.listing.create({
    data: {
      ownerId: req.user.id,
      title, description, type, rent: parseInt(rent),
      deposit: parseInt(deposit), maintenance: parseInt(maintenance || 0),
      address, city, state, pincode,
      latitude: parseFloat(latitude), longitude: parseFloat(longitude),
      bedrooms: parseInt(bedrooms || 1), bathrooms: parseInt(bathrooms || 1),
      balcony: Boolean(balcony), parking: Boolean(parking),
      areaSqFt: areaSqFt ? parseInt(areaSqFt) : null,
      furnished: Boolean(furnished),
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      ...(amenities && {
        amenities: { create: amenities },
      }),
      ...(roomSharing && type === 'ROOM_SHARING' && {
        roomSharing: { create: roomSharing },
      }),
    },
    include: { amenities: true, roomSharing: true },
  });

  res.status(201).json({ success: true, data: listing });
});

// ─── PUT /listings/:id — update listing ───────────────
const updateListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized', 403);
  }

  const { amenities, roomSharing, availableFrom, ...data } = req.body;

  // Cast numeric inputs in data
  if (data.rent !== undefined) data.rent = parseInt(data.rent);
  if (data.deposit !== undefined) data.deposit = parseInt(data.deposit);
  if (data.maintenance !== undefined) data.maintenance = parseInt(data.maintenance || 0);
  if (data.bedrooms !== undefined) data.bedrooms = parseInt(data.bedrooms);
  if (data.bathrooms !== undefined) data.bathrooms = parseInt(data.bathrooms);
  if (data.latitude !== undefined) data.latitude = parseFloat(data.latitude);
  if (data.longitude !== undefined) data.longitude = parseFloat(data.longitude);
  if (data.areaSqFt !== undefined) data.areaSqFt = data.areaSqFt ? parseInt(data.areaSqFt) : null;
  if (data.furnished !== undefined) data.furnished = Boolean(data.furnished);
  if (data.balcony !== undefined) data.balcony = Boolean(data.balcony);
  if (data.parking !== undefined) data.parking = Boolean(data.parking);

  // Parse amenities
  let amenitiesUpsert = undefined;
  if (amenities) {
    const amenitiesClean = {};
    for (const k in amenities) {
      amenitiesClean[k] = Boolean(amenities[k]);
    }
    amenitiesUpsert = { upsert: { create: amenitiesClean, update: amenitiesClean } };
  }

  // Parse roomSharing only if type is ROOM_SHARING
  let roomSharingUpsert = undefined;
  const activeType = data.type || listing.type;
  if (activeType === 'ROOM_SHARING' && roomSharing) {
    const roomSharingClean = {
      genderRequired: roomSharing.genderRequired || 'ANY',
      minAge: roomSharing.minAge ? parseInt(roomSharing.minAge) : null,
      maxAge: roomSharing.maxAge ? parseInt(roomSharing.maxAge) : null,
      smoking: Boolean(roomSharing.smoking),
      drinking: Boolean(roomSharing.drinking),
      vegOnly: Boolean(roomSharing.vegOnly),
      petsAllowed: Boolean(roomSharing.petsAllowed),
      currentOccupants: parseInt(roomSharing.currentOccupants || 0),
      totalRooms: parseInt(roomSharing.totalRooms || 1),
    };
    roomSharingUpsert = { upsert: { create: roomSharingClean, update: roomSharingClean } };
  } else if (activeType === 'HOUSE_RENTAL') {
    await prisma.roomSharing.deleteMany({ where: { listingId: req.params.id } });
  }

  const updated = await prisma.listing.update({
    where: { id: req.params.id },
    data: {
      ...data,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      ...(amenitiesUpsert && { amenities: amenitiesUpsert }),
      ...(roomSharingUpsert && { roomSharing: roomSharingUpsert }),
    },
    include: { amenities: true, roomSharing: true, photos: true },
  });

  res.json({ success: true, data: updated });
});

// ─── DELETE /listings/:id ─────────────────────────────
const deleteListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
    throw new AppError('Not authorized', 403);
  }

  // Soft delete
  await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'DELETED' } });
  res.json({ success: true, message: 'Listing deleted' });
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

module.exports = { getListings, getListing, createListing, updateListing, deleteListing, getMyListings };
