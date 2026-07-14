const router = require('express').Router();
const { createReview, getUserReviews } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:userId', getUserReviews);
router.post('/', protect, createReview);

module.exports = router;
