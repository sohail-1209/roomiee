// Saved listings controller
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /saved/:listingId — save a listing ──────────
const saveListing = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AppError('Listing not found', 404);

  await prisma.savedListing.create({ data: { userId: req.user.id, listingId } });
  res.status(201).json({ success: true, message: 'Saved' });
});

// ─── DELETE /saved/:listingId — unsave ────────────────
const unsaveListing = asyncHandler(async (req, res) => {
  await prisma.savedListing.delete({
    where: { userId_listingId: { userId: req.user.id, listingId: req.params.listingId } },
  });
  res.json({ success: true, message: 'Removed from saved' });
});

// ─── GET /saved — all saved listings for current user ─
const getSaved = asyncHandler(async (req, res) => {
  const saved = await prisma.savedListing.findMany({
    where: { userId: req.user.id },
    include: {
      listing: {
        select: {
          id: true, title: true, type: true, rent: true, deposit: true,
          city: true, address: true, bedrooms: true, furnished: true,
          status: true, createdAt: true,
          owner: { select: { id: true, name: true, profileImage: true, avgRating: true } },
          photos: { where: { isPrimary: true }, take: 1 },
          amenities: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: saved.map((s) => s.listing) });
});

module.exports = { saveListing, unsaveListing, getSaved };
