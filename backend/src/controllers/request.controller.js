// Request controller — send, accept, reject, contact reveal
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendNotification } = require('../services/notification.service');

// ─── POST /requests — tenant sends request ────────────
const createRequest = asyncHandler(async (req, res) => {
  const { listingId, message, price } = req.body;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { owner: { select: { id: true, name: true, fcmToken: true } } },
  });
  if (!listing || listing.status !== 'ACTIVE') throw new AppError('Listing not available', 404);
  if (listing.ownerId === req.user.id) throw new AppError('Cannot request your own listing', 400);

  const request = await prisma.request.create({
    data: { listingId, tenantId: req.user.id, message, price },
    include: {
      tenant: { select: { id: true, name: true, profileImage: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  // Create chat linked to this request
  await prisma.chat.create({
    data: {
      ownerId: listing.ownerId,
      tenantId: req.user.id,
      listingId,
      requestId: request.id,
    },
  });

  // Notify owner
  await sendNotification({
    userId: listing.ownerId,
    fcmToken: listing.owner.fcmToken,
    title: '📥 New Rental Request',
    body: `${req.user.name} sent a request for "${listing.title}"`,
    type: 'NEW_REQUEST',
    data: { requestId: request.id, listingId },
  });

  res.status(201).json({ success: true, data: request });
});

// ─── PATCH /requests/:id — accept or reject ───────────
const updateRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // ACCEPTED | REJECTED
  if (!['ACCEPTED', 'REJECTED'].includes(status)) throw new AppError('Invalid status', 400);

  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
    include: {
      listing: { select: { ownerId: true, title: true, type: true } },
      tenant: { select: { id: true, fcmToken: true, name: true } },
    },
  });
  if (!request) throw new AppError('Request not found', 404);
  // Allow listing owner or creator of roommate listing to accept
  const isOwner = request.listing.ownerId === req.user.id;
  const isRoommateHost = req.user.role === 'TENANT' && request.listing.ownerId === req.user.id;
  if (!isOwner && !isRoommateHost) throw new AppError('Not authorized', 403);
  if (request.status !== 'PENDING') throw new AppError('Request already processed', 400);

  let chat = null;

  if (status === 'ACCEPTED') {
    // Update request status + mark listing as BOOKED (transactional)
    // Only mark listing as RENTED if it is not a HOSTEL, since hostels have multiple capacity
    const transactionOps = [
      prisma.request.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } })
    ];
    if (request.listing.type !== 'HOSTEL') {
      transactionOps.push(prisma.listing.update({ where: { id: request.listingId }, data: { status: 'RENTED' } }));
    }
    
    const [updatedRequest] = await prisma.$transaction(transactionOps);

    chat = await prisma.chat.findUnique({ where: { requestId: request.id } });

    await sendNotification({
      userId: request.tenantId,
      fcmToken: request.tenant.fcmToken,
      title: '✅ Request Accepted!',
      body: `Your request for "${request.listing.title}" was accepted. Chat is now unlocked.`,
      type: 'REQUEST_ACCEPTED',
      data: { requestId: request.id, chatId: chat?.id, listingId: request.listingId },
    });
  } else {
    await prisma.request.update({ where: { id: request.id }, data: { status: 'REJECTED' } });

    await sendNotification({
      userId: request.tenantId,
      fcmToken: request.tenant.fcmToken,
      title: '❌ Request Rejected',
      body: `Your request for "${request.listing.title}" was declined.`,
      type: 'REQUEST_REJECTED',
      data: { requestId: request.id, listingId: request.listingId },
    });
  }

  res.json({ success: true, data: { status, chatId: chat?.id } });
});

const getRequests = asyncHandler(async (req, res) => {
  const requests = await prisma.request.findMany({
    where: {
      OR: [
        { listing: { ownerId: req.user.id } },
        { tenantId: req.user.id }
      ]
    },
    include: {
      tenant: { select: { id: true, name: true, profileImage: true, avgRating: true } },
      listing: {
        select: {
          id: true, title: true, city: true, rent: true, type: true, ownerId: true,
          photos: { where: { isPrimary: true }, take: 1 },
        },
      },
      chat: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
});

// ─── GET /requests/:id/contact — reveal phone after acceptance ─
const getContact = asyncHandler(async (req, res) => {
  const request = await prisma.request.findUnique({
    where: { id: req.params.id },
    include: {
      listing: {
        include: { owner: { select: { id: true, phone: true, name: true } } },
      },
    },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (request.tenantId !== req.user.id) throw new AppError('Not authorized', 403);
  if (request.status !== 'ACCEPTED') throw new AppError('Request not accepted yet', 403);

  res.json({
    success: true,
    data: {
      ownerName: request.listing.owner.name,
      phone: request.listing.owner.phone,
    },
  });
});

module.exports = { createRequest, updateRequest, getRequests, getContact };
