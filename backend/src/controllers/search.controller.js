// Search controller — full text + AI natural language search
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { parseAIQuery } = require('../services/ai.service');

// ─── GET /search — full text + filter search ──────────
const search = asyncHandler(async (req, res) => {
  const {
    q, type, city, minRent, maxRent, furnished,
    gender, bedrooms, page = 1, limit = 12,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: 'ACTIVE',
    ...(type && { type }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
    ...(minRent && { rent: { gte: parseInt(minRent) } }),
    ...(maxRent && { rent: { lte: parseInt(maxRent) } }),
    ...(furnished !== undefined && { furnished: furnished === 'true' }),
    ...(bedrooms && { bedrooms: parseInt(bedrooms) }),
    ...(gender && { roomSharing: { genderRequired: { in: [gender, 'ANY'] } } }),
    // Full text search across title, description, address, city
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [results, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: {
        id: true, title: true, type: true, status: true,
        rent: true, deposit: true, city: true, address: true,
        latitude: true, longitude: true, bedrooms: true, furnished: true,
        views: true, createdAt: true,
        owner: { select: { id: true, name: true, profileImage: true, avgRating: true } },
        photos: { where: { isPrimary: true }, take: 1 },
        amenities: true,
        _count: { select: { savedBy: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({
    success: true,
    data: results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
});

// ─── POST /search/ai — natural language → filters → results ─
const aiSearch = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query required' });

  // Parse the natural language query to structured filters
  const filters = await parseAIQuery(query);

  // Run the parsed filters through normal search logic
  req.query = { ...filters };
  const where = {
    status: 'ACTIVE',
    ...(filters.type && { type: filters.type }),
    ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
    ...(filters.maxRent && { rent: { lte: parseInt(filters.maxRent) } }),
    ...(filters.minRent && { rent: { gte: parseInt(filters.minRent) } }),
    ...(filters.furnished !== undefined && { furnished: filters.furnished }),
    ...(filters.gender && { roomSharing: { genderRequired: { in: [filters.gender, 'ANY'] } } }),
    ...(filters.bedrooms && { bedrooms: parseInt(filters.bedrooms) }),
  };

  const results = await prisma.listing.findMany({
    where,
    select: {
      id: true, title: true, type: true, rent: true, deposit: true,
      city: true, address: true, latitude: true, longitude: true,
      bedrooms: true, furnished: true, createdAt: true,
      owner: { select: { id: true, name: true, profileImage: true, avgRating: true } },
      photos: { where: { isPrimary: true }, take: 1 },
      amenities: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  res.json({ success: true, data: results, parsedFilters: filters });
});

module.exports = { search, aiSearch };
