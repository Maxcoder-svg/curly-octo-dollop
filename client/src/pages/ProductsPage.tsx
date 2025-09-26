import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Product, Category } from '../types';
import ShoppingCart from '../components/ShoppingCart';
import './ModernProductsPage.css';

interface ProductWithReviews extends Product {
  average_rating?: number;
  review_count?: number;
  distance?: number;
}

const ProductsPage: React.FC = () => {
  const { state } = useAuth();
  const [products, setProducts] = useState<ProductWithReviews[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  
  const selectedCategory = searchParams.get('category');
  const searchTerm = searchParams.get('search') || '';

  const fetchCartSummary = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    try {
      const response = await api.get('/cart/summary');
      setCartItemCount(response.data.item_count);
    } catch (error) {
      console.error('Error fetching cart summary:', error);
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    fetchCartSummary();
  }, [fetchCartSummary]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products', {
            params: {
              category_id: selectedCategory,
              search: searchTerm
            }
          }),
          api.get('/categories')
        ]);
        
        // Enhance products with ratings and reviews
        const enhancedProducts = await Promise.all(
          productsRes.data.map(async (product: Product) => {
            try {
              const reviewResponse = await api.get(`/reviews/product/${product.id}/summary`);
              return {
                ...product,
                average_rating: reviewResponse.data.average_rating,
                review_count: reviewResponse.data.review_count,
                distance: Math.floor(Math.random() * 50) + 1 // Mock distance
              };
            } catch (error) {
              return {
                ...product,
                average_rating: 0,
                review_count: 0,
                distance: Math.floor(Math.random() * 50) + 1
              };
            }
          })
        );
        
        setProducts(enhancedProducts);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchTerm]);

  const addToCart = async (productId: number) => {
    if (!state.isAuthenticated) {
      alert('Please log in to add items to cart');
      return;
    }

    try {
      await api.post('/cart/add', { product_id: productId, quantity: 1 });
      fetchCartSummary();
      // Show success animation
      const btn = document.querySelector(`[data-product-id="${productId}"]`);
      if (btn) {
        btn.classList.add('cart-added');
        setTimeout(() => btn.classList.remove('cart-added'), 1000);
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.error || 'Failed to add item to cart');
    }
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategoryFilter = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating':
        return filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'distance':
        return filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, sortBy, priceRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          ⭐
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-products">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="container">
        {/* Header with Cart */}
        <div className="products-header">
          <div className="header-content">
            <h1>Marketplace</h1>
            <p>Discover amazing products from trusted sellers</p>
          </div>
          
          {state.isAuthenticated && (
            <button
              className="cart-button"
              onClick={() => setCartOpen(true)}
            >
              🛒 Cart
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            <button className="search-btn">🔍</button>
          </div>
          
          <button 
            className="filters-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {showFilters ? '▼' : '▶'}
          </button>
        </div>

        <div className="products-content">
          {/* Sidebar Filters */}
          <div className={`filters-sidebar ${showFilters ? 'open' : ''}`}>
            <div className="filter-group">
              <h3>Categories</h3>
              <div className="category-filters">
                <button
                  className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => handleCategoryFilter('')}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter(category.id.toString())}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Sort By</h3>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Best Rated</option>
                <option value="distance">Nearest First</option>
              </select>
            </div>

            <div className="filter-group">
              <h3>Price Range</h3>
              <div className="price-range">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="range-slider"
                />
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="range-slider"
                />
                <div className="range-values">
                  {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredAndSortedProducts.length === 0 ? (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredAndSortedProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    {product.image_url ? (
                      <img 
                        src={`http://localhost:5000${product.image_url}`} 
                        alt={product.title}
                      />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                    
                    {product.distance && (
                      <div className="distance-badge">
                        📍 {product.distance}km away
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    
                    <p className="product-description">
                      {product.description}
                    </p>
                    
                    <div className="product-rating">
                      {product.average_rating && product.average_rating > 0 ? (
                        <>
                          <div className="stars">
                            {renderStars(Math.round(product.average_rating))}
                          </div>
                          <span className="rating-text">
                            {product.average_rating.toFixed(1)} ({product.review_count} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="no-rating">No reviews yet</span>
                      )}
                    </div>
                    
                    <div className="product-seller">
                      by {product.seller_name}
                    </div>
                    
                    <div className="product-footer">
                      <div className="product-price">
                        {formatCurrency(product.price)}
                      </div>
                      
                      {state.isAuthenticated && (
                        <button
                          data-product-id={product.id}
                          onClick={() => addToCart(product.id)}
                          className="add-to-cart-btn"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shopping Cart */}
        <ShoppingCart
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
        />
      </div>
    </div>
  );
};

export default ProductsPage;