import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Category } from '../types';
import './AddProduct.css';

interface AddProductProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddProduct: React.FC<AddProductProps> = ({ onClose, onSuccess }) => {
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    detailed_description: '',
    price: '',
    category_id: '',
    location_address: '',
    location_lat: '',
    location_lng: '',
    media_urls: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, bidsRes] = await Promise.all([
          api.get('/categories'),
          api.get('/bids/user')
        ]);
        
        setAvailableCategories(categoriesRes.data);
        
        // Filter categories where user has won bids
        const wonBids = bidsRes.data.filter((bid: any) => bid.status === 'accepted');
        const wonCategoryIds = wonBids.map((bid: any) => bid.category_id);
        const available = categoriesRes.data.filter((cat: Category) => 
          wonCategoryIds.includes(cat.id)
        );
        
        setAvailableCategories(available);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.title || !formData.price || !formData.category_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      alert('Price must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
      };

      await api.post('/products', productData);
      alert('Product created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.error || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location_lat: position.coords.latitude.toString(),
            location_lng: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enter manually if needed.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (availableCategories.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Add New Product</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="no-categories">
              <h3>No Available Categories</h3>
              <p>You need to win a bid for a category before you can add products.</p>
              <p>Go to the bidding section to place bids on categories you're interested in.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content add-product-modal">
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Product Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter product title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price ($) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category_id">Category *</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a category</option>
                {availableCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Brief Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief overview of your product"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="detailed_description">Detailed Description</label>
              <textarea
                id="detailed_description"
                name="detailed_description"
                value={formData.detailed_description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Detailed description including specifications, condition, usage instructions, etc."
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="location_address">Location Address</label>
              <div className="location-input-group">
                <input
                  type="text"
                  id="location_address"
                  name="location_address"
                  value={formData.location_address}
                  onChange={handleInputChange}
                  placeholder="Enter the location where buyers can collect this item"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="location-btn"
                  title="Use my current location"
                >
                  📍 Use Current Location
                </button>
              </div>
            </div>

            <div className="location-coords">
              <div className="form-group">
                <label htmlFor="location_lat">Latitude</label>
                <input
                  type="number"
                  id="location_lat"
                  name="location_lat"
                  value={formData.location_lat}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="Auto-filled"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location_lng">Longitude</label>
                <input
                  type="number"
                  id="location_lng"
                  name="location_lng"
                  value={formData.location_lng}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="Auto-filled"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;