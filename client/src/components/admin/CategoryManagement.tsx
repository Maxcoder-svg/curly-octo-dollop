import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminComponents.css';

interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const { state } = useAuth();
  const user = state.user;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (error) {
      setError('Failed to load categories');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully');
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
        fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess('Category deleted successfully');
        fetchCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Category Management</h2>
        <div className="loading-spinner">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Category Management</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Add New Category
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-header">
              <h3>{category.name}</h3>
              <div className="category-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(category)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(category.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="category-description">{category.description || 'No description provided'}</p>
            <div className="category-meta">
              <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="created-date">
                Created: {new Date(category.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="empty-state">
          <h3>No categories found</h3>
          <p>Start by creating your first category to organize products in your marketplace.</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Create First Category
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="form-control"
                  placeholder="e.g., Electronics, Books, Clothing"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-control"
                  rows={3}
                  placeholder="Describe what products belong in this category..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;