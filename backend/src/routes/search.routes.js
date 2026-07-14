const router = require('express').Router();
const { search, aiSearch } = require('../controllers/search.controller');

router.get('/', search);
router.post('/ai', aiSearch);

module.exports = router;
