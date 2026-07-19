// Search controller — full text + AI natural language search
const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { parseAIQuery } = require('../services/ai.service');
const cache = require('../utils/cache');

// Optimized listing select for search feeds
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

// ─── GET /search — full text + filter search ──────────
const search = asyncHandler(async (req, res) => {
  const {
    q, type, city, minRent, maxRent, furnished,
    gender, bedrooms, page = 1, limit = 12,
  } = req.query;

  const cacheKey = `search:${JSON.stringify(req.query)}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: { in: ['ACTIVE', 'RENTED'] },
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
      select: listingFeedSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.listing.count({ where }),
  ]);

  const responseData = {
    success: true,
    data: results,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  };

  cache.set(cacheKey, responseData, 30);
  res.json(responseData);
});

// ─── POST /search/ai — natural language → filters + keywords → results ──
const aiSearch = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query required' });

  const cacheKey = `aisearch:${query}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  // Parse the natural language query to structured filters + keywords
  const parsed = await parseAIQuery(query);
  const { keywords = [], ...filters } = parsed;

  // Build structured filter where clause
  const structuredWhere = {
    status: { in: ['ACTIVE', 'RENTED'] },
    ...(filters.type && { type: filters.type }),
    ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
    ...(filters.maxRent && { rent: { lte: parseInt(filters.maxRent) } }),
    ...(filters.minRent && { rent: { gte: parseInt(filters.minRent) } }),
    ...(filters.furnished !== undefined && { furnished: filters.furnished }),
    ...(filters.gender && {
      OR: [
        { roomSharing: { genderRequired: { in: [filters.gender, 'ANY'] } } },
        { hostelSharing: { genderRequired: { in: [filters.gender, 'ANY'] } } },
      ],
    }),
    ...(filters.bedrooms && { bedrooms: parseInt(filters.bedrooms) }),
    ...(filters.parking !== undefined && { amenities: { parking: true } }),
    ...(filters.wifi !== undefined && { amenities: { wifi: true } }),
    ...(filters.ac !== undefined && { amenities: { ac: true } }),
    ...(filters.security !== undefined && { amenities: { security: true } }),
    ...(filters.lift !== undefined && { amenities: { lift: true } }),
    ...(filters.kitchen !== undefined && { amenities: { kitchen: true } }),
    ...(filters.powerBackup !== undefined && { amenities: { powerBackup: true } }),
    ...(filters.waterSupply !== undefined && { amenities: { waterSupply: true } }),
    ...(filters.cctv !== undefined && { amenities: { cctv: true } }),
    ...(filters.balcony !== undefined && { balcony: filters.balcony }),
  };

  // Build free-text search conditions from keywords + original query
  const textSearchTerms = [...keywords];

  // Also add area as a text search term (matches address/description)
  if (filters.area) textSearchTerms.push(filters.area);
  // Add city as text search too (matches address containing city name)
  if (filters.city) textSearchTerms.push(filters.city);

  // Clean up short/noise terms
  const cleanTerms = textSearchTerms
    .map(t => t.trim())
    .filter(t => t.length > 1);

  const textOR = cleanTerms.length > 0
    ? cleanTerms.map(term => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          { address: { contains: term, mode: 'insensitive' } },
          { city: { contains: term, mode: 'insensitive' } },
        ],
      }))
    : [];

  // Combine: structured filters AND (any text match OR no text search)
  const where = {
    ...structuredWhere,
    ...(textOR.length > 0 && { OR: textOR }),
  };

  const results = await prisma.listing.findMany({
    where,
    select: listingFeedSelect,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // If text search returned too few results, fall back to progressively looser searches
  let finalResults = results;
  if (results.length < 3) {
    // Fallback 1: structured filters only (remove text constraint)
    if (textOR.length > 0) {
      const fallbackResults = await prisma.listing.findMany({
        where: structuredWhere,
        select: listingFeedSelect,
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      const seenIds = new Set(results.map(r => r.id));
      for (const r of fallbackResults) {
        if (!seenIds.has(r.id)) { finalResults.push(r); seenIds.add(r.id); }
      }
    }

    // Fallback 2: if still empty, remove type filter and search by city + text only
    if (finalResults.length === 0 && (filters.city || filters.area)) {
      const looseWhere = {
        status: { in: ['ACTIVE', 'RENTED'] },
        ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
        ...(filters.maxRent && { rent: { lte: parseInt(filters.maxRent) } }),
        ...(filters.minRent && { rent: { gte: parseInt(filters.minRent) } }),
        // Remove type, bedrooms, gender constraints — just match city + budget + text
        ...(textOR.length > 0 && { OR: textOR }),
      };
      const looseResults = await prisma.listing.findMany({
        where: looseWhere,
        select: listingFeedSelect,
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      const seenIds = new Set(finalResults.map(r => r.id));
      for (const r of looseResults) {
        if (!seenIds.has(r.id)) { finalResults.push(r); seenIds.add(r.id); }
      }
    }
  }

  const responseData = { success: true, data: finalResults, parsedFilters: { ...filters, keywords } };
  cache.set(cacheKey, responseData, 60);
  res.json(responseData);
});

module.exports = { search, aiSearch };
