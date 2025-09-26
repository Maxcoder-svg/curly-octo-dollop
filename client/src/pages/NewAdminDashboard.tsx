import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserManagement from '../components/admin/UserManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import SystemSettings from '../components/admin/SystemSettings';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import BidManagement from '../components/admin/BidManagement';
import './AdminDashboard.css';

interface AdminStats {
  users: {
    total_users: number;
    buyers: number;
    sellers: number;
    admins: number;
    active_users: number;
    new_users_30d: number;
  };
  products: {
    total_products: number;
    active_products: number;
    new_products_30d: number;
  };
  orders: {
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
    orders_30d: number;
  };
  bids: {
    total_bids: number;
    pending_bids: number;
    accepted_bids: number;
    avg_bid_amount: number;
    highest_bid: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { state } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get('/analytics/admin');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'bids', label: 'Bid Management', icon: '⚖️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'System Settings', icon: '⚙️' },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'bids':
        return <BidManagement />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <SystemSettings />;
      default:
        return (
          <div className="dashboard-overview">
            <div className="overview-stats">
              {stats && (
                <>
                  <div className="stats-grid">
                    <div className="stat-section">
                      <h3>👥 Users</h3>
                      <div className="stat-items">
                        <div className="stat-item primary">
                          <div className="stat-number">{stats.users.total_users}</div>
                          <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.users.active_users}</div>
                          <div className="stat-label">Active</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.users.new_users_30d}</div>
                          <div className="stat-label">New (30d)</div>
                        </div>
                      </div>
                    </div>

                    <div className="stat-section">
                      <h3>📦 Products</h3>
                      <div className="stat-items">
                        <div className="stat-item primary">
                          <div className="stat-number">{stats.products.total_products}</div>
                          <div className="stat-label">Total Products</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.products.active_products}</div>
                          <div className="stat-label">Active</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.products.new_products_30d}</div>
                          <div className="stat-label">New (30d)</div>
                        </div>
                      </div>
                    </div>

                    <div className="stat-section">
                      <h3>💰 Sales</h3>
                      <div className="stat-items">
                        <div className="stat-item primary">
                          <div className="stat-number">{formatCurrency(stats.orders.total_revenue)}</div>
                          <div className="stat-label">Total Revenue</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.orders.total_orders}</div>
                          <div className="stat-label">Orders</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.orders.orders_30d}</div>
                          <div className="stat-label">Recent (30d)</div>
                        </div>
                      </div>
                    </div>

                    <div className="stat-section">
                      <h3>⚖️ Bids</h3>
                      <div className="stat-items">
                        <div className="stat-item primary">
                          <div className="stat-number">{stats.bids.total_bids}</div>
                          <div className="stat-label">Total Bids</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{stats.bids.pending_bids}</div>
                          <div className="stat-label">Pending</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-number">{formatCurrency(stats.bids.highest_bid)}</div>
                          <div className="stat-label">Highest Bid</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-grid">
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('users')}
                >
                  <div className="action-icon">👥</div>
                  <div className="action-label">Manage Users</div>
                  <div className="action-desc">View and manage user accounts</div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('bids')}
                >
                  <div className="action-icon">⚖️</div>
                  <div className="action-label">Process Bids</div>
                  <div className="action-desc">Award categories to highest bidders</div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('categories')}
                >
                  <div className="action-icon">🏷️</div>
                  <div className="action-label">Manage Categories</div>
                  <div className="action-desc">Add or remove product categories</div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('settings')}
                >
                  <div className="action-icon">⚙️</div>
                  <div className="action-label">System Settings</div>
                  <div className="action-desc">Configure app settings and integrations</div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <p>Welcome, {state.user?.username}</p>
        </div>
        
        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <h1>{menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}</h1>
        </div>
        <div className="content-body">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;