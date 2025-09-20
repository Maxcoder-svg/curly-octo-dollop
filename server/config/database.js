const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'buyer',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bids table
    db.run(`
      CREATE TABLE IF NOT EXISTS bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Category privileges table (tracks current seller for each category)
    db.run(`
      CREATE TABLE IF NOT EXISTS category_privileges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        bid_amount DECIMAL(10,2) NOT NULL,
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        image_url VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (seller_id) REFERENCES users (id)
      )
    `);

    // Notifications table
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users (id),
        FOREIGN KEY (seller_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database initialized successfully');
        resolve();
      }
    });
  });
};

// Insert default categories
const insertDefaultCategories = () => {
  return new Promise((resolve, reject) => {
    const categories = [
      { name: 'Cars', description: 'Automobiles and automotive parts' },
      { name: 'Household', description: 'Home appliances and household items' },
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Fashion', description: 'Clothing, shoes, and accessories' },
      { name: 'Real Estate', description: 'Properties for sale or rent' },
      { name: 'Services', description: 'Professional and personal services' }
    ];

    let completed = 0;
    
    categories.forEach(category => {
      db.run(
        'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description],
        (err) => {
          if (err) {
            reject(err);
          } else {
            completed++;
            if (completed === categories.length) {
              resolve();
            }
          }
        }
      );
    });
  });
};

// Create admin user if not exists
const createAdminUser = async () => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  db.run(
    'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    ['admin', 'admin@marketplace.com', hashedPassword, 'admin']
  );
};

module.exports = {
  db,
  initDatabase,
  insertDefaultCategories,
  createAdminUser
};