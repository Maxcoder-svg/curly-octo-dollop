import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, logout } from '../../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(dispatch);
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (state.user?.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'seller':
        return '/seller-dashboard';
      case 'buyer':
        return '/buyer-dashboard';
      default:
        return '/';
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>Marketplace</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/products" className="nav-link">Products</Link>
          
          {state.isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="nav-link">
                Dashboard
              </Link>
              {state.user?.role === 'seller' && (
                <Link to="/bidding" className="nav-link">Bidding</Link>
              )}
              <div className="user-info">
                <span className="username">
                  {state.user?.username} ({state.user?.role})
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;