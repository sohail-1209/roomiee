const router = require('express').Router();
const { getListings, getListing, createListing, updateListing, deleteListing, getMyListings, updateListingStatus, getMyBookings, createFromBooking } = require('../controllers/listing.controller');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, getListings);
router.get('/owner/me', protect, restrictTo('OWNER', 'TENANT', 'ADMIN'), getMyListings);
router.get('/tenant/bookings', protect, restrictTo('TENANT'), getMyBookings);
router.post('/from-booking', protect, restrictTo('TENANT'), createFromBooking);
router.get('/:id', optionalAuth, getListing);
router.post('/', protect, restrictTo('OWNER', 'TENANT'), createListing);
router.put('/:id', protect, restrictTo('OWNER', 'TENANT', 'ADMIN'), updateListing);
router.patch('/:id/status', protect, restrictTo('OWNER', 'TENANT', 'ADMIN'), updateListingStatus);
router.delete('/:id', protect, restrictTo('OWNER', 'TENANT', 'ADMIN'), deleteListing);

module.exports = router;
