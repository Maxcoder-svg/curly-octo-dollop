import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, login } from '../context/AuthContext';
import api from '../services/api';
import { AuthResponse } from '../types';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login', formData);
      const { user, token } = response.data;
      
      login(dispatch, user, token);
      
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'seller':
          navigate('/seller-dashboard');
          break;
        case 'buyer':
          navigate('/buyer-dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Login to Marketplace</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
            <div className="demo-accounts">
              <h4>Demo Accounts:</h4>
              <p><strong>Admin:</strong> admin@marketplace.com / admin123</p>
              <p><strong>Note:</strong> Register as seller to participate in bidding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;