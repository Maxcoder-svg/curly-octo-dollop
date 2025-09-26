const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all system settings (admin only)
router.get('/', auth, adminAuth, (req, res) => {
  db.all('SELECT * FROM system_settings ORDER BY category, key', (err, settings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Group settings by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.json(grouped);
  });
});

// Get settings by category
router.get('/category/:category', auth, adminAuth, (req, res) => {
  const category = req.params.category;
  
  db.all('SELECT * FROM system_settings WHERE category = ? ORDER BY key', [category], (err, settings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(settings);
  });
});

// Get specific setting
router.get('/key/:key', auth, adminAuth, (req, res) => {
  const key = req.params.key;
  
  db.get('SELECT * FROM system_settings WHERE key = ?', [key], (err, setting) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(setting);
  });
});

// Update setting value
router.put('/key/:key', auth, adminAuth, (req, res) => {
  const key = req.params.key;
  const { value } = req.body;
  
  db.run(`
    UPDATE system_settings 
    SET value = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE key = ?
  `, [value, key], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting updated successfully' });
  });
});

// Update multiple settings
router.put('/bulk', auth, adminAuth, (req, res) => {
  const { settings } = req.body;
  
  if (!Array.isArray(settings)) {
    return res.status(400).json({ error: 'Settings must be an array' });
  }
  
  const updatePromises = settings.map(setting => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE system_settings 
        SET value = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE key = ?
      `, [setting.value, setting.key], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ key: setting.key, updated: this.changes > 0 });
        }
      });
    });
  });
  
  Promise.all(updatePromises)
    .then(results => {
      res.json({ 
        message: 'Settings updated successfully',
        results 
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Failed to update settings' });
    });
});

// Create new setting
router.post('/', auth, adminAuth, (req, res) => {
  const { key, value, category, description } = req.body;
  
  if (!key || !category) {
    return res.status(400).json({ error: 'Key and category are required' });
  }
  
  db.run(`
    INSERT INTO system_settings (key, value, category, description)
    VALUES (?, ?, ?, ?)
  `, [key, value || '', category, description || ''], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Setting key already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({ 
      message: 'Setting created successfully',
      settingId: this.lastID
    });
  });
});

// Delete setting
router.delete('/key/:key', auth, adminAuth, (req, res) => {
  const key = req.params.key;
  
  db.run('DELETE FROM system_settings WHERE key = ?', [key], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting deleted successfully' });
  });
});

// Get public settings (non-sensitive settings that can be accessed by frontend)
router.get('/public', (req, res) => {
  const publicKeys = [
    'bidding_period_hours',
    'privilege_validity_months',
    'notification_method',
    'auth_provider'
  ];
  
  db.all(`
    SELECT key, value, description
    FROM system_settings 
    WHERE key IN (${publicKeys.map(() => '?').join(',')})
  `, publicKeys, (err, settings) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Convert to key-value object
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json(settingsObj);
  });
});

module.exports = router;