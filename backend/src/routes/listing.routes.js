const router = require('express').Router();
const { getListings, getListing, createListing, updateListing, deleteListing, getMyListings } = require('../controllers/listing.controller');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, getListings);
router.get('/owner/me', protect, restrictTo('OWNER', 'ADMIN'), getMyListings);
router.get('/:id', optionalAuth, getListing);
router.post('/', protect, restrictTo('OWNER'), createListing);
router.put('/:id', protect, restrictTo('OWNER', 'ADMIN'), updateListing);
router.delete('/:id', protect, restrictTo('OWNER', 'ADMIN'), deleteListing);

module.exports = router;
