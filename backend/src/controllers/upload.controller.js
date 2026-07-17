// Upload controller — Cloudinary-only photo uploads
const cloudinary = require('../services/cloudinary.service');
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /upload/listing-photos/:listingId ────────────
const uploadListingPhotos = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id) throw new AppError('Not authorized', 403);

  if (!req.files?.length) throw new AppError('No files uploaded', 400);

  const currentCount = await prisma.photo.count({ where: { listingId } });

  const uploads = await Promise.all(
    req.files.map(async (file, index) => {
      const result = await cloudinary.uploader.upload_stream_promise(file.buffer, {
        folder: `quikden/listings/${listingId}`,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto:low', fetch_format: 'auto' }],
        format: 'jpg',
      });

      return {
        listingId,
        url: result.secure_url,
        publicId: result.public_id,
        isPrimary: currentCount === 0 && index === 0,
        order: currentCount + index,
      };
    })
  );

  const photos = await prisma.photo.createMany({ data: uploads });
  res.status(201).json({ success: true, count: photos.count });
});

// ─── DELETE /upload/photos/:photoId ───────────────────
const deletePhoto = asyncHandler(async (req, res) => {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.photoId } });
  if (!photo) throw new AppError('Photo not found', 404);

  const listing = await prisma.listing.findUnique({ where: { id: photo.listingId } });
  if (listing.ownerId !== req.user.id) throw new AppError('Not authorized', 403);

  await cloudinary.uploader.destroy(photo.publicId);
  await prisma.photo.delete({ where: { id: photo.id } });
  res.json({ success: true, message: 'Photo deleted' });
});

// ─── POST /upload/profile ─────────────────────────────
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  const result = await cloudinary.uploader.upload_stream_promise(req.file.buffer, {
    folder: 'quikden/profiles',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:low', fetch_format: 'auto' }],
    format: 'jpg',
  });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage: result.secure_url },
  });

  res.json({ success: true, data: { url: result.secure_url } });
});

module.exports = { uploadListingPhotos, deletePhoto, uploadProfilePhoto };
