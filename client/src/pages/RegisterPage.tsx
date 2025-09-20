import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, login } from '../context/AuthContext';
import api from '../services/api';
import { AuthResponse } from '../types';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'seller',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      const { user, token } = response.data;
      login(dispatch, user, token);
      
      // Redirect based on user role
      switch (user.role) {
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
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Register for Marketplace</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
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
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={loading}
                className="form-select"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
              <small className="form-hint">
                Sellers can participate in bidding for category privileges
              </small>
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
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="auth-links">
            <p>
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;