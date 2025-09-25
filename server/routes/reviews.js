const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', (req, res) => {
  const productId = req.params.productId;
  
  db.all(`
    SELECT r.*, u.username 
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `, [productId], (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(reviews);
  });
});

// Get product rating summary
router.get('/product/:productId/summary', (req, res) => {
  const productId = req.params.productId;
  
  db.get(`
    SELECT 
      COUNT(*) as review_count,
      COALESCE(AVG(rating), 0) as average_rating,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
      COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
      COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
      COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
      COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
    FROM reviews 
    WHERE product_id = ?
  `, [productId], (err, summary) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(summary);
  });
});

// Add or update a review
router.post('/product/:productId', auth, (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;
  const userId = req.user.id;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  // Check if user has purchased this product (optional - can be disabled for demo)
  /*
  db.get(`
    SELECT id FROM orders 
    WHERE buyer_id = ? AND product_id = ? AND status = 'completed'
  `, [userId, productId], (err, order) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!order) {
      return res.status(403).json({ error: 'You can only review products you have purchased' });
    }
    
    // Continue with review creation...
  });
  */
  
  // Insert or update review
  db.run(`
    INSERT INTO reviews (product_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(product_id, user_id)
    DO UPDATE SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP
  `, [productId, userId, rating, comment, rating, comment], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to save review' });
    }
    
    res.json({ 
      message: 'Review saved successfully',
      reviewId: this.lastID
    });
  });
});

// Delete a review
router.delete('/:reviewId', auth, (req, res) => {
  const reviewId = req.params.reviewId;
  const userId = req.user.id;
  
  db.run(`
    DELETE FROM reviews 
    WHERE id = ? AND user_id = ?
  `, [reviewId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }
    
    res.json({ message: 'Review deleted successfully' });
  });
});

// Get user's reviews
router.get('/user', auth, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT r.*, p.title as product_title, p.image_url as product_image
    FROM reviews r
    JOIN products p ON r.product_id = p.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `, [userId], (err, reviews) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(reviews);
  });
});

module.exports = router;