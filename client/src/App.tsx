import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/common/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductsPage from './pages/ProductsPage';
import BiddingPage from './pages/BiddingPage';
import './App.css';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}> = ({ children, allowedRoles }) => {
  const { state } = useAuth();
  
  if (state.isLoading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(state.user?.role || '')) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { state } = useAuth();
  
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={
            state.isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
          } />
          <Route path="/register" element={
            state.isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
          } />
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/buyer-dashboard" element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/seller-dashboard" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/bidding" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <BiddingPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
