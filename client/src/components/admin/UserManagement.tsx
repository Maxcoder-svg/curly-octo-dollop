import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminComponents.css';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  is_active: boolean;
  posting_privileges: boolean;
  location_address?: string;
  created_at: string;
  statistics?: {
    productCount: number;
    buyerOrders: number;
    sales: number;
  };
  privileges?: Array<{
    id: number;
    category_name: string;
    is_permanent: boolean;
    end_date: string;
  }>;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    role: '',
    search: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await api.get(`/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: number, action: string, value?: any) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let data = {};

      switch (action) {
        case 'toggle-status':
          endpoint = `/users/${userId}/status`;
          data = { is_active: value };
          break;
        case 'toggle-privileges':
          endpoint = `/users/${userId}/posting-privileges`;
          data = { posting_privileges: value };
          break;
        case 'change-role':
          endpoint = `/users/${userId}/role`;
          data = { role: value };
          break;
        case 'delete':
          endpoint = `/users/${userId}`;
          method = 'DELETE';
          break;
        default:
          return;
      }

      await api.request({
        method: method,
        url: endpoint,
        data: method === 'DELETE' ? undefined : data
      });

      fetchUsers(); // Refresh the list
      if (action === 'delete') {
        alert('User deleted successfully');
      }
    } catch (error: any) {
      console.error(`Error ${action}:`, error);
      alert(error.response?.data?.error || `Failed to ${action}`);
    }
  };

  const showUserDetails = async (user: User) => {
    try {
      const response = await api.get(`/users/${user.id}`);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const grantPermanentPrivilege = async (userId: number, categoryId: string) => {
    if (!categoryId) return;
    
    try {
      await api.post(`/users/${userId}/grant-privilege`, {
        category_id: parseInt(categoryId)
      });
      alert('Permanent privilege granted successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error granting privilege:', error);
      alert(error.response?.data?.error || 'Failed to grant privilege');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="user-management">
      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Privileges</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={!user.is_active ? 'inactive-user' : ''}>
                    <td>
                      <div className="user-info">
                        <div className="user-details">
                          <div className="username">{user.username}</div>
                          <div className="email">{user.email}</div>
                          {user.phone && <div className="phone">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUserAction(user.id, 'change-role', e.target.value)}
                        className="role-select"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={user.is_active}
                          onChange={(e) => handleUserAction(user.id, 'toggle-status', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">{user.is_active ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={user.posting_privileges}
                          onChange={(e) => handleUserAction(user.id, 'toggle-privileges', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">
                          {user.posting_privileges ? 'Allowed' : 'Blocked'}
                        </span>
                      </label>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => showUserDetails(user)}
                          className="btn-icon"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              handleUserAction(user.id, 'delete');
                            }
                          }}
                          className="btn-icon danger"
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalUsers} total users)
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNext}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content user-modal">
            <div className="modal-header">
              <h2>User Details: {selectedUser.username}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-section">
                  <h3>Basic Information</h3>
                  <div className="detail-item">
                    <label>Username:</label>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="detail-item">
                      <label>Phone:</label>
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Role:</label>
                    <span className={`role-badge ${selectedUser.role}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Joined:</label>
                    <span>{formatDate(selectedUser.created_at)}</span>
                  </div>
                </div>

                {selectedUser.statistics && (
                  <div className="detail-section">
                    <h3>Activity Statistics</h3>
                    <div className="stats-grid-small">
                      <div className="stat-item-small">
                        <div className="stat-number">{selectedUser.statistics.productCount}</div>
                        <div className="stat-label">Products</div>
                      </div>
                      <div className="stat-item-small">
                        <div className="stat-number">{selectedUser.statistics.buyerOrders}</div>
                        <div className="stat-label">Orders Made</div>
                      </div>
                      <div className="stat-item-small">
                        <div className="stat-number">{selectedUser.statistics.sales}</div>
                        <div className="stat-label">Sales</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.privileges && selectedUser.privileges.length > 0 && (
                  <div className="detail-section">
                    <h3>Category Privileges</h3>
                    <div className="privileges-list">
                      {selectedUser.privileges.map(privilege => (
                        <div key={privilege.id} className="privilege-item">
                          <span className="privilege-category">{privilege.category_name}</span>
                          <span className={`privilege-type ${privilege.is_permanent ? 'permanent' : 'temporary'}`}>
                            {privilege.is_permanent ? 'Permanent' : `Until ${formatDate(privilege.end_date)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;