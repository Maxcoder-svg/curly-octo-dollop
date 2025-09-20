const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const register = async (req, res) => {
  try {
    const { username, email, password, role = 'buyer' } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, existingUser) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user
        db.run(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, role],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Generate JWT token
            const token = jwt.sign(
              { id: this.lastID, username, email, role },
              process.env.JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              message: 'User created successfully',
              token,
              user: { id: this.lastID, username, email, role }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProfile = (req, res) => {
  db.get(
    'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
};

module.exports = { register, login, getProfile };