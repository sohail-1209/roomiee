const router = require('express').Router();
const { getChats, getMessages, sendMessage } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getChats);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);

module.exports = router;
