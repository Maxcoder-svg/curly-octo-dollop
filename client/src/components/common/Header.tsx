import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, logout } from '../../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout(dispatch);
    navigate('/');
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo" onClick={closeMobileMenu}>
          <h1>🏪 Marketplace</h1>
        </Link>

        {/* Mobile menu button */}
        <button
          className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${isMenuOpen ? 'nav-mobile-open' : ''}`}>
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              🏠 Home
            </Link>
            <Link to="/products" className="nav-link" onClick={closeMobileMenu}>
              📦 Products
            </Link>

            {state.isAuthenticated && (
              <>
                <Link to={getDashboardLink()} className="nav-link" onClick={closeMobileMenu}>
                  📊 Dashboard
                </Link>
                {state.user?.role === 'seller' && (
                  <Link to="/bidding" className="nav-link" onClick={closeMobileMenu}>
                    🔨 Bidding
                  </Link>
                )}
              </>
            )}
          </div>

          {state.isAuthenticated ? (
            <div className="user-section" ref={userMenuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {state.user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-details">
                  <span className="username">{state.user?.username}</span>
                  <span className="user-role">{state.user?.role}</span>
                </div>
                <span className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`}>▼</span>
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info-detailed">
                      <div className="user-avatar large">
                        {state.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="username-large">{state.user?.username}</div>
                        <div className="user-email">{state.user?.email || 'No email'}</div>
                        <div className={`role-badge role-${state.user?.role}`}>
                          {state.user?.role?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-menu">
                    <Link
                      to={getDashboardLink()}
                      className="dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        closeMobileMenu();
                      }}
                    >
                      <span className="dropdown-icon">📊</span>
                      My Dashboard
                    </Link>

                    {state.user?.role === 'admin' && (
                      <>
                        <Link
                          to="/admin-dashboard?tab=users"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">👥</span>
                          User Management
                        </Link>
                        <Link
                          to="/admin-dashboard?tab=analytics"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">📈</span>
                          Analytics
                        </Link>
                        <Link
                          to="/admin-dashboard?tab=settings"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">⚙️</span>
                          System Settings
                        </Link>
                      </>
                    )}

                    {state.user?.role === 'seller' && (
                      <>
                        <Link
                          to="/seller-dashboard?tab=products"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">📦</span>
                          My Products
                        </Link>
                        <Link
                          to="/bidding"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">🔨</span>
                          Bidding Hub
                        </Link>
                      </>
                    )}

                    {state.user?.role === 'buyer' && (
                      <>
                        <Link
                          to="/buyer-dashboard?tab=bids"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">🎯</span>
                          My Bids
                        </Link>
                        <Link
                          to="/buyer-dashboard?tab=purchases"
                          className="dropdown-item"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-icon">🛒</span>
                          Purchases
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="dropdown-divider"></div>

                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-item"
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-section">
              <Link to="/login" className="auth-link" onClick={closeMobileMenu}>
                🔑 Login
              </Link>
              <Link to="/register" className="auth-btn" onClick={closeMobileMenu}>
                📝 Register
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
    </header>
  );
};

export default Header;