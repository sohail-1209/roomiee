// Report controller
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /reports ────────────────────────────────────
const createReport = asyncHandler(async (req, res) => {
  const { listingId, reason, details } = req.body;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AppError('Listing not found', 404);

  const existing = await prisma.report.findUnique({
    where: { listingId_reporterId: { listingId, reporterId: req.user.id } },
  });
  if (existing) throw new AppError('You have already reported this listing', 409);

  const report = await prisma.report.create({
    data: { listingId, reporterId: req.user.id, reason, details },
  });
  res.status(201).json({ success: true, data: report });
});

// ─── GET /reports (admin only) ────────────────────────
const getReports = asyncHandler(async (req, res) => {
  const reports = await prisma.report.findMany({
    include: {
      listing: { select: { id: true, title: true } },
      reporter: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: reports });
});

// ─── PATCH /reports/:id (admin only) ─────────────────
const updateReport = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json({ success: true, data: report });
});

module.exports = { createReport, getReports, updateReport };
