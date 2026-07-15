// Upload controller — Cloudinary photo uploads with local storage fallback
const cloudinary = require('../services/cloudinary.service');
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const fs = require('fs');
const path = require('path');

// ─── POST /upload/listing-photos/:listingId ────────────
const uploadListingPhotos = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.ownerId !== req.user.id) throw new AppError('Not authorized', 403);

  if (!req.files?.length) throw new AppError('No files uploaded', 400);

  // Get current photo count to set order
  const currentCount = await prisma.photo.count({ where: { listingId } });

  const uploads = await Promise.all(
    req.files.map(async (file, index) => {
      let url;
      let publicId;

      try {
        const result = await cloudinary.uploader.upload_stream_promise(file.buffer, {
          folder: `roomiee/listings/${listingId}`,
          resource_type: 'image',
          transformation: [{ width: 1200, height: 800, crop: 'fill', quality: 'auto' }],
        });
        url = result.secure_url;
        publicId = result.public_id;
      } catch (err) {
        console.warn('Cloudinary upload failed, falling back to local file system:', err.message);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.originalname || 'photo.jpg'}`;
        const localPath = path.join(__dirname, '../../public/uploads', fileName);
        fs.writeFileSync(localPath, file.buffer);
        url = `/uploads/${fileName}`;
        publicId = `local-${fileName}`;
      }

      return {
        listingId,
        url,
        publicId,
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

  // Delete from Cloudinary if not local
  if (photo.publicId.startsWith('local-')) {
    const fileName = photo.publicId.substring(6);
    const localPath = path.join(__dirname, '../../public/uploads', fileName);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } else {
    try {
      await cloudinary.uploader.destroy(photo.publicId);
    } catch (e) {
      console.warn('Failed to delete photo from Cloudinary:', e.message);
    }
  }

  await prisma.photo.delete({ where: { id: photo.id } });
  res.json({ success: true, message: 'Photo deleted' });
});

// ─── POST /upload/profile ─────────────────────────────
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);

  let url;
  try {
    const result = await cloudinary.uploader.upload_stream_promise(req.file.buffer, {
      folder: 'roomiee/profiles',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });
    url = result.secure_url;
  } catch (err) {
    console.warn('Cloudinary profile upload failed, falling back to local file system:', err.message);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-profile.jpg`;
    const localPath = path.join(__dirname, '../../public/uploads', fileName);
    fs.writeFileSync(localPath, req.file.buffer);
    url = `/uploads/${fileName}`;
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { profileImage: url },
  });

  res.json({ success: true, data: { url } });
});

module.exports = { uploadListingPhotos, deletePhoto, uploadProfilePhoto };
