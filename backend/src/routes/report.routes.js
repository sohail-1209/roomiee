const router = require('express').Router();
const { createReport, getReports, updateReport } = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.post('/', protect, createReport);
router.get('/', protect, restrictTo('ADMIN'), getReports);
router.patch('/:id', protect, restrictTo('ADMIN'), updateReport);

module.exports = router;
