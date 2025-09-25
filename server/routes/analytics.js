const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Seller analytics
router.get('/seller', auth, (req, res) => {
  const sellerId = req.user.id;
  
  Promise.all([
    // Total products
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM products WHERE seller_id = ? AND status != "deleted"',
        [sellerId],
        (err, result) => err ? reject(err) : resolve(result.count)
      );
    }),
    
    // Total orders
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM orders WHERE seller_id = ?',
        [sellerId],
        (err, result) => err ? reject(err) : resolve(result.count)
      );
    }),
    
    // Total revenue
    new Promise((resolve, reject) => {
      db.get(
        'SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE seller_id = ? AND status = "completed"',
        [sellerId],
        (err, result) => err ? reject(err) : resolve(result.revenue)
      );
    }),
    
    // Recent sales (last 30 days)
    new Promise((resolve, reject) => {
      db.all(`
        SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
        FROM orders 
        WHERE seller_id = ? AND created_at >= date('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [sellerId], (err, result) => err ? reject(err) : resolve(result));
    }),
    
    // Top products
    new Promise((resolve, reject) => {
      db.all(`
        SELECT p.title, p.price, COUNT(o.id) as order_count, 
               SUM(o.total_amount) as revenue,
               AVG(r.rating) as avg_rating
        FROM products p
        LEFT JOIN orders o ON p.id = o.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.seller_id = ? AND p.status != 'deleted'
        GROUP BY p.id
        ORDER BY order_count DESC, revenue DESC
        LIMIT 10
      `, [sellerId], (err, result) => err ? reject(err) : resolve(result));
    }),
    
    // Category performance
    new Promise((resolve, reject) => {
      db.all(`
        SELECT c.name as category, COUNT(p.id) as products, 
               COUNT(o.id) as orders, SUM(o.total_amount) as revenue
        FROM categories c
        JOIN products p ON c.id = p.category_id
        LEFT JOIN orders o ON p.id = o.product_id
        WHERE p.seller_id = ? AND p.status != 'deleted'
        GROUP BY c.id
        ORDER BY revenue DESC
      `, [sellerId], (err, result) => err ? reject(err) : resolve(result));
    })
  ])
  .then(([totalProducts, totalOrders, totalRevenue, recentSales, topProducts, categoryPerformance]) => {
    res.json({
      summary: {
        totalProducts,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue) || 0,
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders) : 0
      },
      recentSales,
      topProducts,
      categoryPerformance
    });
  })
  .catch(err => {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  });
});

// Admin system analytics
router.get('/admin', auth, adminAuth, (req, res) => {
  Promise.all([
    // User statistics
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers,
          COUNT(CASE WHEN role = 'seller' THEN 1 END) as sellers,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_users_30d
        FROM users WHERE is_active = TRUE
      `, (err, result) => err ? reject(err) : resolve(result[0]));
    }),
    
    // Product statistics
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as new_products_30d
        FROM products WHERE status != 'deleted'
      `, (err, result) => err ? reject(err) : resolve(result[0]));
    }),
    
    // Order statistics
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as orders_30d
        FROM orders
      `, (err, result) => err ? reject(err) : resolve(result[0]));
    }),
    
    // Category statistics
    new Promise((resolve, reject) => {
      db.all(`
        SELECT c.name, COUNT(p.id) as product_count, 
               COUNT(DISTINCT p.seller_id) as sellers,
               COUNT(o.id) as total_orders,
               SUM(o.total_amount) as revenue
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.status != 'deleted'
        LEFT JOIN orders o ON p.id = o.product_id
        WHERE c.is_active = TRUE
        GROUP BY c.id
        ORDER BY product_count DESC
      `, (err, result) => err ? reject(err) : resolve(result));
    }),
    
    // Recent activity
    new Promise((resolve, reject) => {
      db.all(`
        SELECT DATE(created_at) as date, 
               COUNT(DISTINCT user_id) as active_users,
               COUNT(*) as total_orders,
               SUM(total_amount) as daily_revenue
        FROM orders
        WHERE created_at >= date('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, (err, result) => err ? reject(err) : resolve(result));
    }),
    
    // Bid statistics
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_bids,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bids,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_bids,
          AVG(amount) as avg_bid_amount,
          MAX(amount) as highest_bid
        FROM bids
      `, (err, result) => err ? reject(err) : resolve(result[0]));
    })
  ])
  .then(([userStats, productStats, orderStats, categoryStats, recentActivity, bidStats]) => {
    res.json({
      users: userStats,
      products: productStats,
      orders: {
        ...orderStats,
        total_revenue: parseFloat(orderStats.total_revenue) || 0
      },
      categories: categoryStats,
      recentActivity,
      bids: {
        ...bidStats,
        avg_bid_amount: parseFloat(bidStats.avg_bid_amount) || 0,
        highest_bid: parseFloat(bidStats.highest_bid) || 0
      }
    });
  })
  .catch(err => {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  });
});

// Get revenue chart data
router.get('/revenue-chart', auth, (req, res) => {
  const { period = '30', type = 'daily' } = req.query;
  const isAdmin = req.user.role === 'admin';
  const sellerId = isAdmin ? null : req.user.id;
  
  let dateGrouping, dateFilter;
  switch (type) {
    case 'monthly':
      dateGrouping = "strftime('%Y-%m', created_at)";
      dateFilter = `date('now', '-${period} months')`;
      break;
    case 'weekly':
      dateGrouping = "strftime('%Y-W%W', created_at)";
      dateFilter = `date('now', '-${period} weeks')`;
      break;
    default: // daily
      dateGrouping = "DATE(created_at)";
      dateFilter = `date('now', '-${period} days')`;
  }
  
  let query = `
    SELECT ${dateGrouping} as period,
           COUNT(*) as order_count,
           SUM(total_amount) as revenue
    FROM orders 
    WHERE created_at >= ${dateFilter}
  `;
  
  let params = [];
  if (!isAdmin && sellerId) {
    query += ' AND seller_id = ?';
    params.push(sellerId);
  }
  
  query += ` GROUP BY ${dateGrouping} ORDER BY period DESC LIMIT 50`;
  
  db.all(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results.map(row => ({
      period: row.period,
      orderCount: row.order_count,
      revenue: parseFloat(row.revenue) || 0
    })));
  });
});

module.exports = router;