import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Category, Bid } from '../types';
import './Dashboard.css';

const AdminDashboard: React.FC = () => {
  const { state } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, bidsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/bids/all')
        ]);
        
        setCategories(categoriesRes.data);
        setAllBids(bidsRes.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processBids = async (categoryId: number) => {
    try {
      await api.post(`/bids/process/${categoryId}`);
      alert('Bid results processed successfully!');
      // Refresh data
      const bidsRes = await api.get('/bids/all');
      setAllBids(bidsRes.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process bids');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const pendingBids = allBids.filter(bid => bid.status === 'pending');
  const groupedBids = pendingBids.reduce((acc, bid) => {
    if (!acc[bid.category_id]) {
      acc[bid.category_id] = [];
    }
    acc[bid.category_id].push(bid);
    return acc;
  }, {} as Record<number, Bid[]>);

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {state.user?.username}!</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{pendingBids.length}</div>
            <div className="stat-label">Pending Bids</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Object.keys(groupedBids).length}</div>
            <div className="stat-label">Categories with Bids</div>
          </div>
        </div>

        <div className="admin-section">
          <h2>Bid Management</h2>
          <p>Process bidding results for categories with pending bids</p>
          
          {Object.keys(groupedBids).length === 0 ? (
            <div className="no-data">
              <p>No pending bids to process</p>
            </div>
          ) : (
            <div className="bid-categories">
              {Object.entries(groupedBids).map(([categoryId, bids]) => {
                const category = categories.find(c => c.id === parseInt(categoryId));
                const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
                
                return (
                  <div key={categoryId} className="bid-category-card">
                    <h3>{category?.name}</h3>
                    <div className="bid-list">
                      <h4>Current Bids (Highest to Lowest):</h4>
                      {sortedBids.map(bid => (
                        <div key={bid.id} className="bid-item">
                          <span className="bidder">{bid.username}</span>
                          <span className="bid-amount">${bid.amount}</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => processBids(parseInt(categoryId))}
                      className="process-btn"
                    >
                      Award to Highest Bidder
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Category Management</h3>
            <p>Add, edit, or remove product categories</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>

          <div className="dashboard-card">
            <h3>User Management</h3>
            <p>Manage user accounts and permissions</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>

          <div className="dashboard-card">
            <h3>System Analytics</h3>
            <p>View platform statistics and performance</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>

          <div className="dashboard-card">
            <h3>Settings</h3>
            <p>Configure platform settings and policies</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;