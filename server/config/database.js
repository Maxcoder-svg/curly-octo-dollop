const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database.sqlite';
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    let tablesCreated = 0;
    const totalTables = 10; // Updated count for new tables
    
    const checkComplete = () => {
      tablesCreated++;
      if (tablesCreated === totalTables) {
        console.log('Database initialized successfully');
        resolve();
      }
    };
    
    // Users table - Add phone number and location fields
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'buyer',
        location_lat DECIMAL(10,8),
        location_lng DECIMAL(11,8),
        location_address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        posting_privileges BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Categories table
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

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
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

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
        is_permanent BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Products table - Enhanced with location and media support
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        detailed_description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        image_url VARCHAR(255),
        video_url VARCHAR(255),
        media_urls TEXT, -- JSON array of additional media URLs
        location_lat DECIMAL(10,8),
        location_lng DECIMAL(11,8),
        location_address TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (seller_id) REFERENCES users (id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

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
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

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
      if (err) reject(err);
      else checkComplete();
    });

    // Cart items table
    db.run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        UNIQUE(user_id, product_id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // Reviews table
    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(product_id, user_id)
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
    });

    // System settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        category VARCHAR(50),
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) reject(err);
      else checkComplete();
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

// Initialize default system settings
const initializeSystemSettings = () => {
  return new Promise((resolve, reject) => {
    const defaultSettings = [
      { key: 'bidding_period_hours', value: '24', category: 'bidding', description: 'Default bidding period in hours' },
      { key: 'privilege_validity_months', value: '4', category: 'bidding', description: 'Default privilege validity in months' },
      { key: 'notification_method', value: 'email', category: 'notifications', description: 'Default notification method (email, sms, both)' },
      { key: 'emailjs_service_id', value: '', category: 'emailjs', description: 'EmailJS Service ID' },
      { key: 'emailjs_template_id', value: '', category: 'emailjs', description: 'EmailJS Template ID' },
      { key: 'emailjs_user_id', value: '', category: 'emailjs', description: 'EmailJS User ID' },
      { key: 'twilio_account_sid', value: '', category: 'twilio', description: 'Twilio Account SID' },
      { key: 'twilio_auth_token', value: '', category: 'twilio', description: 'Twilio Auth Token' },
      { key: 'twilio_phone_number', value: '', category: 'twilio', description: 'Twilio Phone Number' },
      { key: 'paystack_public_key', value: '', category: 'paystack', description: 'Paystack Public Key' },
      { key: 'paystack_secret_key', value: '', category: 'paystack', description: 'Paystack Secret Key' },
      { key: 'cloudinary_cloud_name', value: '', category: 'cloudinary', description: 'Cloudinary Cloud Name' },
      { key: 'cloudinary_api_key', value: '', category: 'cloudinary', description: 'Cloudinary API Key' },
      { key: 'cloudinary_api_secret', value: '', category: 'cloudinary', description: 'Cloudinary API Secret' },
      { key: 'auth_provider', value: 'local', category: 'auth', description: 'Authentication provider (local, firebase)' },
      { key: 'firebase_config', value: '{}', category: 'firebase', description: 'Firebase configuration JSON' }
    ];

    let completed = 0;
    defaultSettings.forEach(setting => {
      db.run(
        'INSERT OR IGNORE INTO system_settings (key, value, category, description) VALUES (?, ?, ?, ?)',
        [setting.key, setting.value, setting.category, setting.description],
        (err) => {
          if (err) {
            console.error('Error inserting setting:', setting.key, err);
          }
          completed++;
          if (completed === defaultSettings.length) {
            resolve();
          }
        }
      );
    });
  });
};

module.exports = {
  db,
  initDatabase,
  insertDefaultCategories,
  createAdminUser,
  initializeSystemSettings
};