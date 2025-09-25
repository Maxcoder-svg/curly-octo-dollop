import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ShoppingCart.css';

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  title: string;
  price: number;
  image_url?: string;
  seller_name: string;
  category_name: string;
  created_at: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose }) => {
  const { state } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchCartItems = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await api.get('/cart');
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (isOpen && state.isAuthenticated) {
      fetchCartItems();
    }
  }, [isOpen, state.isAuthenticated, fetchCartItems]);

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(cartItemId);
    try {
      await api.put(`/cart/${cartItemId}`, { quantity: newQuantity });
      setCartItems(items => 
        items.map(item => 
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      alert(error.response?.data?.error || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: number) => {
    if (!window.confirm('Remove this item from your cart?')) return;
    
    try {
      await api.delete(`/cart/${cartItemId}`);
      setCartItems(items => items.filter(item => item.id !== cartItemId));
    } catch (error: any) {
      console.error('Error removing item:', error);
      alert(error.response?.data?.error || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Remove all items from your cart?')) return;
    
    try {
      await api.delete('/cart');
      setCartItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      alert(error.response?.data?.error || 'Failed to clear cart');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCheckout = () => {
    // TODO: Implement checkout with Paystack integration
    alert('Checkout functionality will be implemented with Paystack integration');
  };

  if (!isOpen) return null;

  if (!state.isAuthenticated) {
    return (
      <div className="cart-overlay">
        <div className="cart-container">
          <div className="cart-header">
            <h2>Shopping Cart</h2>
            <button className="cart-close" onClick={onClose}>×</button>
          </div>
          <div className="cart-body">
            <div className="empty-cart">
              <p>Please log in to view your cart</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-overlay">
      <div className="cart-container">
        <div className="cart-header">
          <h2>Shopping Cart ({getTotalItems()} items)</h2>
          <button className="cart-close" onClick={onClose}>×</button>
        </div>
        
        <div className="cart-body">
          {loading ? (
            <div className="cart-loading">
              <div className="loading-spinner"></div>
              <p>Loading your cart...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Browse our products and add items to your cart</p>
              <button className="browse-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image">
                      {item.image_url ? (
                        <img src={`http://localhost:5000${item.image_url}`} alt={item.title} />
                      ) : (
                        <div className="no-image">📦</div>
                      )}
                    </div>
                    
                    <div className="item-details">
                      <h4>{item.title}</h4>
                      <p className="item-seller">by {item.seller_name}</p>
                      <p className="item-category">{item.category_name}</p>
                      <p className="item-price">{formatCurrency(item.price)}</p>
                    </div>
                    
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updating === item.id || item.quantity <= 1}
                          className="qty-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="item-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="remove-btn"
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-footer">
                <div className="cart-actions">
                  <button onClick={clearCart} className="clear-cart-btn">
                    Clear Cart
                  </button>
                  <button onClick={onClose} className="continue-shopping-btn">
                    Continue Shopping
                  </button>
                </div>
                
                <div className="cart-total">
                  <div className="total-line">
                    <span>Subtotal ({getTotalItems()} items):</span>
                    <strong>{formatCurrency(getTotalPrice())}</strong>
                  </div>
                  
                  <button onClick={handleCheckout} className="checkout-btn">
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;