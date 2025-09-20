const { db } = require('../config/database');

// Get all categories
const getCategories = (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(categories);
  });
};

// Get category by ID
const getCategoryById = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  });
};

// Create new category (admin only)
const createCategory = (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  db.run(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Category already exists' });
        }
        return res.status(500).json({ error: 'Failed to create category' });
      }
      
      res.status(201).json({
        message: 'Category created successfully',
        category: { id: this.lastID, name, description }
      });
    }
  );
};

// Update category (admin only)
const updateCategory = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  db.run(
    'UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [name, description, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Category name already exists' });
        }
        return res.status(500).json({ error: 'Failed to update category' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ message: 'Category updated successfully' });
    }
  );
};

// Delete category (admin only)
const deleteCategory = (req, res) => {
  const { id } = req.params;
  
  // Check if category has active products
  db.get(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND status = "active"',
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with active products' 
        });
      }
      
      db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete category' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
      });
    }
  );
};

// Get current privilege holder for a category
const getCategoryPrivilege = (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT cp.*, u.username, u.email, c.name as category_name
    FROM category_privileges cp
    JOIN users u ON cp.user_id = u.id
    JOIN categories c ON cp.category_id = c.id
    WHERE cp.category_id = ? AND cp.status = 'active'
    ORDER BY cp.start_date DESC
    LIMIT 1
  `, [id], (err, privilege) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(privilege);
  });
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryPrivilege
};