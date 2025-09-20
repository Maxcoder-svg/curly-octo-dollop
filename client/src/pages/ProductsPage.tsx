import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Product, Category } from '../types';
import './ProductsPage.css';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedCategory = searchParams.get('category');
  const searchTerm = searchParams.get('search') || '';

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
        
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchTerm]);

  const handleCategoryFilter = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get('search') as string;
    
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-page">
      <div className="container">
        <div className="page-header">
          <h1>Products & Services</h1>
          <p>Browse products from our verified sellers</p>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              name="search"
              placeholder="Search products..."
              defaultValue={searchTerm}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>

          <div className="category-filters">
            <button
              onClick={() => handleCategoryFilter('')}
              className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id.toString())}
                className={`filter-btn ${selectedCategory === category.id.toString() ? 'active' : ''}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
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
                  <p className="product-description">{product.description}</p>
                  <div className="product-meta">
                    <span className="product-price">${product.price}</span>
                    <span className="product-category">{product.category_name}</span>
                  </div>
                  <div className="product-seller">
                    <small>Sold by {product.seller_name}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;