import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const BuyerDashboard: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Buyer Dashboard</h1>
          <p>Welcome back, {state.user?.username}!</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Browse Products</h3>
            <p>Explore products from verified sellers across all categories</p>
            <Link to="/products" className="card-action">View Products</Link>
          </div>

          <div className="dashboard-card">
            <h3>Your Orders</h3>
            <p>Track your orders and purchase history</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>

          <div className="dashboard-card">
            <h3>Favorites</h3>
            <p>Manage your favorite products and sellers</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>

          <div className="dashboard-card">
            <h3>Account Settings</h3>
            <p>Update your profile and preferences</p>
            <button className="card-action" disabled>Coming Soon</button>
          </div>
        </div>

        <div className="dashboard-info">
          <div className="info-card">
            <h3>How the Marketplace Works</h3>
            <ul>
              <li>Sellers bid for exclusive category privileges</li>
              <li>Only one seller can sell in each category at a time</li>
              <li>Privileges rotate every 4 months to the next highest bidder</li>
              <li>This ensures competitive pricing and quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;