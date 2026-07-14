const router = require('express').Router();
const multer = require('multer');
const { uploadListingPhotos, deletePhoto, uploadProfilePhoto } = require('../controllers/upload.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Memory storage — buffers are sent to Cloudinary directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  },
});

router.post('/listing-photos/:listingId', protect, restrictTo('OWNER'), upload.array('photos', 10), uploadListingPhotos);
router.delete('/photos/:photoId', protect, deletePhoto);
router.post('/profile', protect, upload.single('photo'), uploadProfilePhoto);

module.exports = router;
