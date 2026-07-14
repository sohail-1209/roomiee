const router = require('express').Router();
const { getUser, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/:id', getUser);
router.patch('/me', protect, updateProfile);

module.exports = router;
