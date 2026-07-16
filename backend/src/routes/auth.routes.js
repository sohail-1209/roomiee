const router = require('express').Router();
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateFcmToken,
  googleAuth,
  completeProfile,
  sendVerificationEmail,
  verifyEmail,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars'),
];
const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/fcm-token', protect, updateFcmToken);

// Google OAuth
router.post('/google', googleAuth);
router.post('/complete-profile', protect, completeProfile);

// Email verification
router.post('/send-verification', protect, sendVerificationEmail);
router.post('/verify-email', verifyEmail);

module.exports = router;
