const express = require('express');
const router = express.Router();
const {
  createBid,
  getCategoryBids,
  getUserBids,
  getAllBids,
  processBidResults
} = require('../controllers/bidController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, requireRole(['seller']), createBid);
router.get('/user', auth, getUserBids);
router.get('/category/:category_id', getCategoryBids);
router.get('/all', auth, requireRole(['admin']), getAllBids);
router.post('/process/:category_id', auth, requireRole(['admin']), processBidResults);

module.exports = router;