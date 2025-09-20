const { db } = require('../config/database');

// Get user notifications
const getNotifications = (req, res) => {
  const user_id = req.user.id;
  
  db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [user_id],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json(notifications);
    }
  );
};

// Mark notification as read
const markAsRead = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  db.run(
    'UPDATE notifications SET read_status = TRUE WHERE id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification marked as read' });
    }
  );
};

// Mark all notifications as read
const markAllAsRead = (req, res) => {
  const user_id = req.user.id;
  
  db.run(
    'UPDATE notifications SET read_status = TRUE WHERE user_id = ? AND read_status = FALSE',
    [user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ 
        message: 'All notifications marked as read',
        updated: this.changes
      });
    }
  );
};

// Create notification (admin/system use)
const createNotification = (user_id, title, message, type) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user_id, title, message, type],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, user_id, title, message, type });
        }
      }
    );
  });
};

// Delete notification
const deleteNotification = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  db.run(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ message: 'Notification deleted' });
    }
  );
};

// Get unread count
const getUnreadCount = (req, res) => {
  const user_id = req.user.id;
  
  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_status = FALSE',
    [user_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ unread_count: result.count });
    }
  );
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  getUnreadCount
};