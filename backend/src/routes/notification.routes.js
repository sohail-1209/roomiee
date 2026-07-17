const router = require('express').Router();
const { getNotifications, markAllRead, markRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
