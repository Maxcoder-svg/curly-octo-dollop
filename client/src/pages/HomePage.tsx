import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Product, Category } from '../types';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { state } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products?limit=6'),
          api.get('/categories')
        ]);
        
        setFeaturedProducts(productsRes.data.slice(0, 6));
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Marketplace</h1>
          <p>A unique marketplace where sellers bid for category privileges</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{categories.length}</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="stat">
              <span className="stat-number">{featuredProducts.length}+</span>
              <span className="stat-label">Products</span>
            </div>
            <div className="stat">
              <span className="stat-number">4</span>
              <span className="stat-label">Month Cycles</span>
            </div>
          </div>
          
          {!state.isAuthenticated && (
            <div className="hero-actions">
              <Link to="/register" className="cta-button primary">Get Started</Link>
              <Link to="/products" className="cta-button secondary">Browse Products</Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How Our Bidding System Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Register as Seller</h3>
              <p>Create an account and select the seller role to participate in bidding</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Bid for Categories</h3>
              <p>Place bids on categories you want to sell in. Higher bidders get priority</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Win Exclusive Rights</h3>
              <p>Highest bidder gets exclusive selling rights for 4 months</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Sell Your Products</h3>
              <p>List and sell products in your category without competition</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <h2>Browse Categories</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/products?category=${category.id}`}
                className="category-card"
              >
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-products">
          <div className="container">
            <h2>Featured Products</h2>
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  {product.image_url && (
                    <img 
                      src={`http://localhost:5000${product.image_url}`} 
                      alt={product.title}
                      className="product-image"
                    />
                  )}
                  <div className="product-info">
                    <h3>{product.title}</h3>
                    <p className="product-price">${product.price}</p>
                    <p className="product-category">{product.category_name}</p>
                    <p className="product-seller">by {product.seller_name}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/products" className="view-all-btn">View All Products</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;