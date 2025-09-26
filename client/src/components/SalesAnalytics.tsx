import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './SalesAnalytics.css';

interface SalesData {
  summary: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  recentSales: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  topProducts: Array<{
    title: string;
    price: number;
    order_count: number;
    revenue: number;
    avg_rating: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    products: number;
    orders: number;
    revenue: number;
  }>;
}

interface SalesAnalyticsProps {
  onClose: () => void;
}

const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ onClose }) => {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, chartRes] = await Promise.all([
          api.get('/analytics/seller'),
          api.get('/analytics/revenue-chart?period=30&type=daily')
        ]);
        
        setData(analyticsRes.data);
        setChartData(chartRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content analytics-modal">
          <div className="loading-analytics">
            <div className="loading-spinner"></div>
            <p>Loading your sales analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="modal-overlay">
        <div className="modal-content analytics-modal">
          <div className="error-state">
            <h3>Unable to load analytics</h3>
            <p>Please try again later.</p>
            <button onClick={onClose} className="btn-primary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content analytics-modal">
        <div className="modal-header">
          <h2>Sales Analytics</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="analytics-body">
          {/* Summary Cards */}
          <div className="analytics-summary">
            <div className="summary-card">
              <div className="summary-number">{data.summary.totalProducts}</div>
              <div className="summary-label">Total Products</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{data.summary.totalOrders}</div>
              <div className="summary-label">Total Orders</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{formatCurrency(data.summary.totalRevenue)}</div>
              <div className="summary-label">Total Revenue</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{formatCurrency(data.summary.averageOrderValue)}</div>
              <div className="summary-label">Avg Order Value</div>
            </div>
          </div>

          <div className="analytics-grid">
            {/* Revenue Chart */}
            <div className="analytics-section">
              <h3>Recent Sales (Last 30 Days)</h3>
              <div className="simple-chart">
                {chartData.length > 0 ? (
                  <div className="chart-bars">
                    {chartData.slice(0, 15).reverse().map((item, index) => (
                      <div key={index} className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{ 
                            height: `${Math.max(10, (item.revenue / Math.max(...chartData.map(d => d.revenue))) * 100)}px`
                          }}
                          title={`${formatDate(item.period)}: ${formatCurrency(item.revenue)}`}
                        ></div>
                        <div className="chart-label">{formatDate(item.period)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No sales data available</div>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="analytics-section">
              <h3>Top Performing Products</h3>
              <div className="products-list">
                {data.topProducts.length > 0 ? (
                  data.topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="product-item">
                      <div className="product-info">
                        <div className="product-title">{product.title}</div>
                        <div className="product-stats">
                          {product.order_count} orders • {formatCurrency(product.revenue)}
                          {product.avg_rating && (
                            <span className="product-rating">
                              ⭐ {product.avg_rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No product sales yet</div>
                )}
              </div>
            </div>

            {/* Category Performance */}
            <div className="analytics-section">
              <h3>Performance by Category</h3>
              <div className="category-list">
                {data.categoryPerformance.length > 0 ? (
                  data.categoryPerformance.map((category, index) => (
                    <div key={index} className="category-item">
                      <div className="category-name">{category.category}</div>
                      <div className="category-stats">
                        <span>{category.products} products</span>
                        <span>{category.orders} orders</span>
                        <span className="revenue">{formatCurrency(category.revenue || 0)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No category data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;