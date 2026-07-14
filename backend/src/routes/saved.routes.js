const router = require('express').Router();
const { saveListing, unsaveListing, getSaved } = require('../controllers/saved.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getSaved);
router.post('/:listingId', protect, saveListing);
router.delete('/:listingId', protect, unsaveListing);

module.exports = router;
