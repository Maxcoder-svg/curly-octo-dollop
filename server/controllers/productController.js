const { db } = require('../config/database');
const path = require('path');

// Create a new product
const createProduct = (req, res) => {
  const { 
    title, 
    description, 
    detailed_description, 
    price, 
    category_id,
    location_lat,
    location_lng,
    location_address,
    media_urls 
  } = req.body;
  const seller_id = req.user.id;
  
  if (!title || !price || !category_id) {
    return res.status(400).json({ error: 'Title, price, and category are required' });
  }
  
  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be positive' });
  }
  
  // Check if user has active privileges for this category OR is admin
  const checkPrivileges = req.user.role === 'admin' ? 
    Promise.resolve(true) : 
    new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM category_privileges 
        WHERE category_id = ? AND user_id = ? AND status = 'active' 
        AND (end_date > CURRENT_TIMESTAMP OR is_permanent = TRUE)
      `, [category_id, seller_id], (err, privilege) => {
        if (err) reject(err);
        else resolve(!!privilege);
      });
    });
  
  checkPrivileges.then(hasPrivilege => {
    if (!hasPrivilege) {
      return res.status(403).json({ 
        error: 'You do not have active selling privileges for this category' 
      });
    }
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(`
      INSERT INTO products (
        title, description, detailed_description, price, category_id, seller_id, 
        image_url, location_lat, location_lng, location_address, media_urls
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, 
      description, 
      detailed_description, 
      price, 
      category_id, 
      seller_id, 
      image_url,
      location_lat || null,
      location_lng || null,
      location_address || null,
      media_urls ? JSON.stringify(media_urls) : null
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create product' });
      }
      
      res.status(201).json({
        message: 'Product created successfully',
        product: {
          id: this.lastID,
          title,
          description,
          detailed_description,
          price,
          category_id,
          seller_id,
          image_url,
          location_lat,
          location_lng,
          location_address,
          media_urls
        }
      });
    });
  }).catch(err => {
    console.error('Privilege check error:', err);
    return res.status(500).json({ error: 'Database error' });
  });
};

// Get all products
const getProducts = (req, res) => {
  const { category_id, seller_id, search } = req.query;
  let query = `
    SELECT p.*, c.name as category_name, u.username as seller_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'active'
  `;
  
  const params = [];
  
  if (category_id) {
    query += ' AND p.category_id = ?';
    params.push(category_id);
  }
  
  if (seller_id) {
    query += ' AND p.seller_id = ?';
    params.push(seller_id);
  }
  
  if (search) {
    query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY p.created_at DESC';
  
  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(products);
  });
};

// Get product by ID
const getProductById = (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT p.*, c.name as category_name, u.username as seller_name, u.email as seller_email
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.seller_id = u.id
    WHERE p.id = ?
  `, [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  });
};

// Update product
const updateProduct = (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;
  const seller_id = req.user.id;
  
  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required' });
  }
  
  if (price <= 0) {
    return res.status(400).json({ error: 'Price must be positive' });
  }
  
  // Check if user owns this product
  db.get('SELECT seller_id FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.seller_id !== seller_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    
    let query = 'UPDATE products SET title = ?, description = ?, price = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [title, description, price];
    
    if (image_url) {
      query += ', image_url = ?';
      params.push(image_url);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update product' });
      }
      
      res.json({ message: 'Product updated successfully' });
    });
  });
};

// Delete product
const deleteProduct = (req, res) => {
  const { id } = req.params;
  const seller_id = req.user.id;
  
  // Check if user owns this product
  db.get('SELECT seller_id FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.seller_id !== seller_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }
    
    db.run('UPDATE products SET status = "deleted" WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete product' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    });
  });
};

// Get seller's products
const getSellerProducts = (req, res) => {
  const seller_id = req.user.id;
  
  db.all(`
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.seller_id = ? AND p.status != 'deleted'
    ORDER BY p.created_at DESC
  `, [seller_id], (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(products);
  });
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts
};