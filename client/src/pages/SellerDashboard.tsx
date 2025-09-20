import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Product, Bid, CategoryPrivilege } from '../types';
import './Dashboard.css';

const SellerDashboard: React.FC = () => {
  const { state } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [privileges, setPrivileges] = useState<CategoryPrivilege[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, bidsRes] = await Promise.all([
          api.get('/products/seller'),
          api.get('/bids/user')
        ]);
        
        setProducts(productsRes.data);
        setBids(bidsRes.data);
      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const activeBids = bids.filter(bid => bid.status === 'pending');
  const wonBids = bids.filter(bid => bid.status === 'accepted');

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Seller Dashboard</h1>
          <p>Welcome back, {state.user?.username}!</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{products.length}</div>
            <div className="stat-label">Your Products</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{activeBids.length}</div>
            <div className="stat-label">Active Bids</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{wonBids.length}</div>
            <div className="stat-label">Won Categories</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Manage Products</h3>
            <p>Add, edit, or remove your products from active categories</p>
            <div className="card-actions">
              <button className="card-action" disabled>Add Product</button>
              {products.length > 0 && (
                <Link to="/products?seller=me" className="card-action secondary">
                  View All
                </Link>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Category Bidding</h3>
            <p>Bid for exclusive selling rights in different categories</p>
            <Link to="/bidding" className="card-action">Place Bids</Link>
          </div>

          <div className="dashboard-card">
            <h3>Your Bids</h3>
            <p>Track your bidding status across categories</p>
            <div className="bid-summary">
              {activeBids.length > 0 ? (
                <ul>
                  {activeBids.slice(0, 3).map(bid => (
                    <li key={bid.id}>
                      {bid.category_name}: ${bid.amount} (Pending)
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No active bids</p>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <h3>Sales Analytics</h3>
            <p>View your sales performance and revenue</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>
        </div>

        {wonBids.length > 0 && (
          <div className="dashboard-info">
            <div className="info-card success">
              <h3>🎉 Congratulations! You have won bidding for:</h3>
              <ul>
                {wonBids.map(bid => (
                  <li key={bid.id}>
                    <strong>{bid.category_name}</strong> - You can now sell in this category!
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;