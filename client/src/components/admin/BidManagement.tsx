import React, { useState, useEffect } from 'react';
import './AdminComponents.css';

interface Bid {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  status: 'active' | 'won' | 'lost' | 'expired';
  created_at: string;
  username: string;
  email: string;
  category_name: string;
  expires_at: string;
}

interface BidStats {
  totalBids: number;
  activeBids: number;
  wonBids: number;
  totalValue: number;
  averageBid: number;
}

const BidManagement: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<BidStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedBids, setSelectedBids] = useState<number[]>([]);

  useEffect(() => {
    fetchBids();
    fetchBidStats();
  }, [filter, sortBy]);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bids/admin?status=${filter}&sort=${sortBy}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBids(data);
      } else {
        throw new Error('Failed to fetch bids');
      }
    } catch (error: any) {
      setError(error.message);
      // Demo data for development
      setBids([
        {
          id: 1,
          user_id: 101,
          category_id: 1,
          amount: 450.00,
          status: 'active',
          created_at: '2024-01-15T10:30:00Z',
          username: 'john_doe',
          email: 'john@example.com',
          category_name: 'Electronics',
          expires_at: '2024-01-20T10:30:00Z'
        },
        {
          id: 2,
          user_id: 102,
          category_id: 2,
          amount: 280.00,
          status: 'won',
          created_at: '2024-01-14T14:20:00Z',
          username: 'sarah_smith',
          email: 'sarah@example.com',
          category_name: 'Fashion',
          expires_at: '2024-01-19T14:20:00Z'
        },
        {
          id: 3,
          user_id: 103,
          category_id: 1,
          amount: 320.00,
          status: 'active',
          created_at: '2024-01-13T09:15:00Z',
          username: 'mike_wilson',
          email: 'mike@example.com',
          category_name: 'Electronics',
          expires_at: '2024-01-18T09:15:00Z'
        },
        {
          id: 4,
          user_id: 104,
          category_id: 3,
          amount: 150.00,
          status: 'expired',
          created_at: '2024-01-10T16:45:00Z',
          username: 'emma_brown',
          email: 'emma@example.com',
          category_name: 'Books',
          expires_at: '2024-01-15T16:45:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBidStats = async () => {
    try {
      const response = await fetch('/api/bids/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch bid statistics');
      }
    } catch (error: any) {
      // Demo stats
      setStats({
        totalBids: 1247,
        activeBids: 342,
        wonBids: 189,
        totalValue: 156780.50,
        averageBid: 367.80
      });
    }
  };

  const handleBidAction = async (bidId: number, action: 'approve' | 'reject' | 'close') => {
    try {
      const response = await fetch(`/api/bids/${bidId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess(`Bid ${action}d successfully`);
        fetchBids();
        fetchBidStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} bid`);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleBulkAction = async (action: 'close' | 'notify') => {
    if (selectedBids.length === 0) {
      setError('Please select bids to perform bulk action');
      return;
    }

    try {
      const response = await fetch(`/api/bids/bulk/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bidIds: selectedBids })
      });

      if (response.ok) {
        setSuccess(`Bulk ${action} completed successfully`);
        setSelectedBids([]);
        fetchBids();
        fetchBidStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to perform bulk ${action}`);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const toggleBidSelection = (bidId: number) => {
    setSelectedBids(prev =>
      prev.includes(bidId)
        ? prev.filter(id => id !== bidId)
        : [...prev, bidId]
    );
  };

  const selectAllBids = () => {
    const allBidIds = bids.map(bid => bid.id);
    setSelectedBids(selectedBids.length === bids.length ? [] : allBidIds);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'status-badge active',
      won: 'status-badge won',
      lost: 'status-badge lost',
      expired: 'status-badge expired'
    };

    return statusClasses[status as keyof typeof statusClasses] || 'status-badge';
  };

  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  if (loading && !stats) {
    return (
      <div className="admin-section">
        <div className="loading-spinner">Loading bid management...</div>
      </div>
    );
  }

  return (
    <div className="bid-management">
      <div className="section-header">
        <div>
          <h2>Bid Management</h2>
          <p>Monitor and manage all bidding activities</p>
        </div>
        <div className="header-actions">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-control"
          >
            <option value="created_at">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="bid-stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{stats.totalBids.toLocaleString()}</h3>
              <p>Total Bids</p>
            </div>
          </div>

          <div className="stat-card active">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>{stats.activeBids.toLocaleString()}</h3>
              <p>Active Bids</p>
            </div>
          </div>

          <div className="stat-card won">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>{stats.wonBids.toLocaleString()}</h3>
              <p>Won Bids</p>
            </div>
          </div>

          <div className="stat-card value">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalValue)}</h3>
              <p>Total Value</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'active', 'won', 'lost', 'expired'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="tab-count">
              {status === 'all' ? bids.length : bids.filter(b => b.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedBids.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedBids.length} bids selected</span>
          <div className="bulk-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => handleBulkAction('notify')}
            >
              Notify Users
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleBulkAction('close')}
            >
              Close Selected
            </button>
          </div>
        </div>
      )}

      {/* Bids Table */}
      <div className="bids-table-container">
        <table className="bids-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedBids.length === filteredBids.length && filteredBids.length > 0}
                  onChange={selectAllBids}
                />
              </th>
              <th>Bidder</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBids.map(bid => (
              <tr key={bid.id} className={selectedBids.includes(bid.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedBids.includes(bid.id)}
                    onChange={() => toggleBidSelection(bid.id)}
                  />
                </td>
                <td className="bidder-info">
                  <div>
                    <strong>{bid.username}</strong>
                    <span className="email">{bid.email}</span>
                  </div>
                </td>
                <td>
                  <span className="category-tag">{bid.category_name}</span>
                </td>
                <td className="amount">
                  {formatCurrency(bid.amount)}
                </td>
                <td>
                  <span className={getStatusBadge(bid.status)}>
                    {bid.status.toUpperCase()}
                  </span>
                </td>
                <td className="date">
                  {formatDate(bid.created_at)}
                </td>
                <td className="date">
                  {formatDate(bid.expires_at)}
                </td>
                <td className="actions">
                  {bid.status === 'active' && (
                    <>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleBidAction(bid.id, 'approve')}
                        title="Approve bid"
                      >
                        ✓
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleBidAction(bid.id, 'reject')}
                        title="Reject bid"
                      >
                        ✗
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleBidAction(bid.id, 'close')}
                    title="Close bid"
                  >
                    🔒
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBids.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No bids found</h3>
          <p>
            {filter === 'all'
              ? 'No bids have been placed yet.'
              : `No ${filter} bids found.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BidManagement;