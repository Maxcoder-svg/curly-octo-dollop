const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all users (admin only)
router.get('/', auth, adminAuth, (req, res) => {
  const { page = 1, limit = 20, role, search, status } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = 'WHERE 1=1';
  let params = [];
  
  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }
  
  if (search) {
    whereClause += ' AND (username LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (status) {
    whereClause += ' AND is_active = ?';
    params.push(status === 'active' ? 1 : 0);
  }
  
  // Get total count
  db.get(`SELECT COUNT(*) as total FROM users ${whereClause}`, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Get paginated users
    const query = `
      SELECT id, username, email, phone, role, is_active, posting_privileges,
             location_address, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    db.all(query, [...params, limit, offset], (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.total / limit),
          totalUsers: countResult.total,
          hasNext: offset + limit < countResult.total,
          hasPrev: page > 1
        }
      });
    });
  });
});

// Get user by ID
router.get('/:id', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  
  // Get user details with statistics
  Promise.all([
    new Promise((resolve, reject) => {
      db.get(`
        SELECT id, username, email, phone, role, is_active, posting_privileges,
               location_lat, location_lng, location_address, created_at, updated_at
        FROM users WHERE id = ?
      `, [userId], (err, user) => err ? reject(err) : resolve(user));
    }),
    
    // User's products count
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status != "deleted"',
        [userId],
        (err, result) => err ? reject(err) : resolve(result.count)
      );
    }),
    
    // User's orders count
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as buyer_orders FROM orders WHERE buyer_id = ?',
        [userId],
        (err, result) => err ? reject(err) : resolve(result.buyer_orders)
      );
    }),
    
    // User's sales count
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as sales FROM orders WHERE seller_id = ?',
        [userId],
        (err, result) => err ? reject(err) : resolve(result.sales)
      );
    }),
    
    // User's active privileges
    new Promise((resolve, reject) => {
      db.all(`
        SELECT cp.*, c.name as category_name
        FROM category_privileges cp
        JOIN categories c ON cp.category_id = c.id
        WHERE cp.user_id = ? AND cp.status = 'active'
      `, [userId], (err, privileges) => err ? reject(err) : resolve(privileges));
    })
  ])
  .then(([user, productCount, buyerOrders, sales, privileges]) => {
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      ...user,
      statistics: {
        productCount,
        buyerOrders,
        sales
      },
      privileges
    });
  })
  .catch(err => {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

// Update user status (activate/deactivate)
router.put('/:id/status', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  const { is_active } = req.body;
  
  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be a boolean value' });
  }
  
  db.run(
    'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [is_active, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
      });
    }
  );
});

// Update user posting privileges
router.put('/:id/posting-privileges', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  const { posting_privileges } = req.body;
  
  if (typeof posting_privileges !== 'boolean') {
    return res.status(400).json({ error: 'posting_privileges must be a boolean value' });
  }
  
  db.run(
    'UPDATE users SET posting_privileges = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [posting_privileges, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        message: `Posting privileges ${posting_privileges ? 'granted' : 'revoked'} successfully`
      });
    }
  );
});

// Grant permanent privilege to a user for a category
router.post('/:id/grant-privilege', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  const { category_id } = req.body;
  
  if (!category_id) {
    return res.status(400).json({ error: 'category_id is required' });
  }
  
  // Check if category exists
  db.get('SELECT id FROM categories WHERE id = ?', [category_id], (err, category) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Remove existing privilege for this category
    db.run('DELETE FROM category_privileges WHERE category_id = ?', [category_id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Grant permanent privilege
      db.run(`
        INSERT INTO category_privileges 
        (category_id, user_id, bid_amount, start_date, end_date, status, is_permanent)
        VALUES (?, ?, 0, CURRENT_TIMESTAMP, '2099-12-31', 'active', TRUE)
      `, [category_id, userId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to grant privilege' });
        }
        
        res.json({ 
          message: 'Permanent privilege granted successfully',
          privilegeId: this.lastID
        });
      });
    });
  });
});

// Remove user privilege for a category
router.delete('/:id/privilege/:categoryId', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  const categoryId = req.params.categoryId;
  
  db.run(
    'DELETE FROM category_privileges WHERE user_id = ? AND category_id = ?',
    [userId, categoryId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Privilege not found' });
      }
      
      res.json({ message: 'Privilege removed successfully' });
    }
  );
});

// Change user role
router.put('/:id/role', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  
  if (!['buyer', 'seller', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be buyer, seller, or admin' });
  }
  
  // Prevent changing the role of the current admin user
  if (req.user.id == userId && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot remove admin role from yourself' });
  }
  
  db.run(
    'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [role, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'User role updated successfully' });
    }
  );
});

// Delete user (soft delete - deactivate)
router.delete('/:id', auth, adminAuth, (req, res) => {
  const userId = req.params.id;
  
  // Prevent deleting the current admin user
  if (req.user.id == userId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  db.run(
    'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'User deleted successfully' });
    }
  );
});

// Get user statistics summary
router.get('/stats/summary', auth, adminAuth, (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers,
          COUNT(CASE WHEN role = 'seller' THEN 1 END) as sellers,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
          COUNT(CASE WHEN posting_privileges = TRUE THEN 1 END) as users_with_posting_privileges
        FROM users
      `, (err, result) => err ? reject(err) : resolve(result));
    }),
    
    new Promise((resolve, reject) => {
      db.all(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= date('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, (err, result) => err ? reject(err) : resolve(result));
    })
  ])
  .then(([summary, recentRegistrations]) => {
    res.json({
      summary,
      recentRegistrations
    });
  })
  .catch(err => {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Database error' });
  });
});

module.exports = router;