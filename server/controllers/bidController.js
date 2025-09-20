const { db } = require('../config/database');

// Create a new bid
const createBid = (req, res) => {
  const { category_id, amount } = req.body;
  const user_id = req.user.id;
  
  if (!category_id || !amount) {
    return res.status(400).json({ error: 'Category ID and amount are required' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Bid amount must be positive' });
  }
  
  // Check if category exists
  db.get('SELECT id FROM categories WHERE id = ?', [category_id], (err, category) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if user already has an active bid for this category
    db.get(
      'SELECT id FROM bids WHERE user_id = ? AND category_id = ? AND status = "pending"',
      [user_id, category_id],
      (err, existingBid) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingBid) {
          // Update existing bid
          db.run(
            'UPDATE bids SET amount = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
            [amount, existingBid.id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to update bid' });
              }
              
              res.json({ 
                message: 'Bid updated successfully',
                bid: { id: existingBid.id, amount, category_id, user_id }
              });
            }
          );
        } else {
          // Create new bid
          db.run(
            'INSERT INTO bids (user_id, category_id, amount) VALUES (?, ?, ?)',
            [user_id, category_id, amount],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create bid' });
              }
              
              res.status(201).json({
                message: 'Bid created successfully',
                bid: { id: this.lastID, amount, category_id, user_id }
              });
            }
          );
        }
      }
    );
  });
};

// Get all bids for a category
const getCategoryBids = (req, res) => {
  const { category_id } = req.params;
  
  db.all(`
    SELECT b.*, u.username, c.name as category_name
    FROM bids b
    JOIN users u ON b.user_id = u.id
    JOIN categories c ON b.category_id = c.id
    WHERE b.category_id = ?
    ORDER BY b.amount DESC, b.created_at ASC
  `, [category_id], (err, bids) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(bids);
  });
};

// Get user's bids
const getUserBids = (req, res) => {
  const user_id = req.user.id;
  
  db.all(`
    SELECT b.*, c.name as category_name
    FROM bids b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `, [user_id], (err, bids) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(bids);
  });
};

// Get all bids (admin only)
const getAllBids = (req, res) => {
  db.all(`
    SELECT b.*, u.username, c.name as category_name
    FROM bids b
    JOIN users u ON b.user_id = u.id
    JOIN categories c ON b.category_id = c.id
    ORDER BY b.created_at DESC
  `, (err, bids) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(bids);
  });
};

// Process bid results for a category (admin only)
const processBidResults = (req, res) => {
  const { category_id } = req.params;
  
  // Get the highest bid for the category
  db.get(`
    SELECT b.*, u.username
    FROM bids b
    JOIN users u ON b.user_id = u.id
    WHERE b.category_id = ? AND b.status = 'pending'
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1
  `, [category_id], (err, winningBid) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!winningBid) {
      return res.status(404).json({ error: 'No pending bids found for this category' });
    }
    
    // Calculate end date (4 months from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Deactivate current privilege holder if any
      db.run(
        'UPDATE category_privileges SET status = "expired" WHERE category_id = ? AND status = "active"',
        [category_id]
      );
      
      // Create new privilege record
      db.run(
        'INSERT INTO category_privileges (category_id, user_id, bid_amount, end_date) VALUES (?, ?, ?, ?)',
        [category_id, winningBid.user_id, winningBid.amount, endDate.toISOString()],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to assign privilege' });
          }
          
          // Mark winning bid as accepted
          db.run(
            'UPDATE bids SET status = "accepted" WHERE id = ?',
            [winningBid.id]
          );
          
          // Mark other bids as rejected
          db.run(
            'UPDATE bids SET status = "rejected" WHERE category_id = ? AND id != ? AND status = "pending"',
            [category_id, winningBid.id]
          );
          
          // Create notification for winner
          db.run(
            `INSERT INTO notifications (user_id, title, message, type) 
             VALUES (?, ?, ?, ?)`,
            [
              winningBid.user_id,
              'Bid Won!',
              `Congratulations! You have won the bidding for the category and gained selling privileges until ${endDate.toLocaleDateString()}.`,
              'bid_won'
            ]
          );
          
          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to complete transaction' });
            }
            
            res.json({
              message: 'Bid results processed successfully',
              winner: {
                username: winningBid.username,
                amount: winningBid.amount,
                end_date: endDate
              }
            });
          });
        }
      );
    });
  });
};

module.exports = {
  createBid,
  getCategoryBids,
  getUserBids,
  getAllBids,
  processBidResults
};