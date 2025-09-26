const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');

// Get user's cart items
router.get('/', auth, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT ci.*, p.title, p.price, p.image_url, p.seller_id,
           u.username as seller_name, c.name as category_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN users u ON p.seller_id = u.id
    JOIN categories c ON p.category_id = c.id
    WHERE ci.user_id = ? AND p.status = 'active'
    ORDER BY ci.created_at DESC
  `, [userId], (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(items);
  });
});

// Add item to cart
router.post('/add', auth, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const userId = req.user.id;
  
  // Check if product exists and is active
  db.get('SELECT id FROM products WHERE id = ? AND status = "active"', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found or inactive' });
    }
    
    // Insert or update cart item
    db.run(`
      INSERT INTO cart_items (user_id, product_id, quantity) 
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, product_id) 
      DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
    `, [userId, product_id, quantity, quantity], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add item to cart' });
      }
      
      res.json({ 
        message: 'Item added to cart successfully',
        cartItemId: this.lastID
      });
    });
  });
});

// Update cart item quantity
router.put('/:id', auth, (req, res) => {
  const { quantity } = req.body;
  const cartItemId = req.params.id;
  const userId = req.user.id;
  
  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be positive' });
  }
  
  db.run(`
    UPDATE cart_items 
    SET quantity = ? 
    WHERE id = ? AND user_id = ?
  `, [quantity, cartItemId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    res.json({ message: 'Cart item updated successfully' });
  });
});

// Remove item from cart
router.delete('/:id', auth, (req, res) => {
  const cartItemId = req.params.id;
  const userId = req.user.id;
  
  db.run(`
    DELETE FROM cart_items 
    WHERE id = ? AND user_id = ?
  `, [cartItemId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    
    res.json({ message: 'Item removed from cart successfully' });
  });
});

// Clear entire cart
router.delete('/', auth, (req, res) => {
  const userId = req.user.id;
  
  db.run('DELETE FROM cart_items WHERE user_id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ 
      message: 'Cart cleared successfully',
      itemsRemoved: this.changes
    });
  });
});

// Get cart summary
router.get('/summary', auth, (req, res) => {
  const userId = req.user.id;
  
  db.get(`
    SELECT 
      COUNT(*) as item_count,
      COALESCE(SUM(ci.quantity * p.price), 0) as total_amount
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? AND p.status = 'active'
  `, [userId], (err, summary) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(summary);
  });
});

module.exports = router;