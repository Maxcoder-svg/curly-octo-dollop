import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import './AdminComponents.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  totalUsers: number;
  totalProducts: number;
  totalBids: number;
  totalRevenue: number;
  monthlyUsers: any[];
  monthlyRevenue: any[];
  categoryDistribution: any[];
  bidStatus: any[];
  topSellers: any[];
  recentActivities: any[];
  userGrowthRate: number;
  averageBidAmount: number;
  conversionRate: number;
  activeListings: number;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/admin?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (error: any) {
      setError(error.message);
      // Fallback to demo data for development
      setAnalytics(generateDemoData());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (): AnalyticsData => {
    return {
      totalUsers: 1247,
      totalProducts: 856,
      totalBids: 3421,
      totalRevenue: 125750.50,
      userGrowthRate: 15.2,
      averageBidAmount: 367.80,
      conversionRate: 8.9,
      activeListings: 342,
      monthlyUsers: [
        { month: 'Jan', users: 45, newUsers: 12 },
        { month: 'Feb', users: 89, newUsers: 25 },
        { month: 'Mar', users: 134, newUsers: 45 },
        { month: 'Apr', users: 187, newUsers: 53 },
        { month: 'May', users: 245, newUsers: 58 },
        { month: 'Jun', users: 298, newUsers: 53 },
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 12500, profit: 3750 },
        { month: 'Feb', revenue: 18700, profit: 5610 },
        { month: 'Mar', revenue: 23400, profit: 7020 },
        { month: 'Apr', revenue: 31200, profit: 9360 },
        { month: 'May', revenue: 28900, profit: 8670 },
        { month: 'Jun', revenue: 35600, profit: 10680 },
      ],
      categoryDistribution: [
        { name: 'Electronics', value: 285, percentage: 33.3 },
        { name: 'Fashion', value: 201, percentage: 23.5 },
        { name: 'Home & Garden', value: 143, percentage: 16.7 },
        { name: 'Sports', value: 98, percentage: 11.4 },
        { name: 'Books', value: 74, percentage: 8.6 },
        { name: 'Others', value: 55, percentage: 6.4 },
      ],
      bidStatus: [
        { status: 'Active', count: 234, color: '#4CAF50' },
        { status: 'Won', count: 189, color: '#2196F3' },
        { status: 'Lost', count: 156, color: '#FF9800' },
        { status: 'Expired', count: 89, color: '#F44336' },
      ],
      topSellers: [
        { name: 'TechStore Pro', sales: 89, revenue: 25600 },
        { name: 'Fashion Hub', sales: 67, revenue: 18900 },
        { name: 'Garden Paradise', sales: 54, revenue: 15400 },
        { name: 'Sports Central', sales: 43, revenue: 12100 },
        { name: 'Book World', sales: 38, revenue: 9800 },
      ],
      recentActivities: [
        { type: 'bid', user: 'John Doe', action: 'placed bid on iPhone 14', time: '2 min ago' },
        { type: 'product', user: 'TechStore', action: 'listed new MacBook Pro', time: '5 min ago' },
        { type: 'user', user: 'Jane Smith', action: 'registered as new user', time: '8 min ago' },
        { type: 'bid', user: 'Mike Johnson', action: 'won bid for Gaming Chair', time: '12 min ago' },
        { type: 'product', user: 'Fashion Hub', action: 'updated product Nike Shoes', time: '15 min ago' },
      ]
    };
  };

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#607D8B'];

  const revenueChartData = {
    labels: analytics?.monthlyRevenue.map(item => item.month) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: analytics?.monthlyRevenue.map(item => item.revenue) || [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Profit ($)',
        data: analytics?.monthlyRevenue.map(item => item.profit) || [],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const bidStatusData = {
    labels: analytics?.bidStatus.map(item => item.status) || [],
    datasets: [
      {
        data: analytics?.bidStatus.map(item => item.count) || [],
        backgroundColor: analytics?.bidStatus.map(item => item.color) || COLORS,
        borderWidth: 0,
      }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="analytics-loading">
          <div className="loading-spinner-large"></div>
          <h3>Loading Analytics...</h3>
          <p>Crunching the numbers for you</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="admin-section">
        <div className="analytics-error">
          <h3>Unable to Load Analytics</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchAnalytics}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header with Time Range Selector */}
      <div className="analytics-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights into your marketplace performance</p>
        </div>
        <div className="time-range-selector">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-control"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>{formatCurrency(analytics.totalRevenue)}</h3>
            <p>Total Revenue</p>
            <span className="kpi-trend positive">+{analytics.userGrowthRate}%</span>
          </div>
        </div>

        <div className="kpi-card users">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>{analytics.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="kpi-trend positive">+15.2%</span>
          </div>
        </div>

        <div className="kpi-card products">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <h3>{analytics.totalProducts.toLocaleString()}</h3>
            <p>Products Listed</p>
            <span className="kpi-trend positive">+8.7%</span>
          </div>
        </div>

        <div className="kpi-card bids">
          <div className="kpi-icon">🏆</div>
          <div className="kpi-content">
            <h3>{analytics.totalBids.toLocaleString()}</h3>
            <p>Total Bids</p>
            <span className="kpi-trend positive">+22.4%</span>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="secondary-kpi-grid">
        <div className="secondary-kpi">
          <span className="kpi-value">{formatCurrency(analytics.averageBidAmount)}</span>
          <span className="kpi-label">Avg Bid Amount</span>
        </div>
        <div className="secondary-kpi">
          <span className="kpi-value">{analytics.conversionRate}%</span>
          <span className="kpi-label">Conversion Rate</span>
        </div>
        <div className="secondary-kpi">
          <span className="kpi-value">{analytics.activeListings}</span>
          <span className="kpi-label">Active Listings</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Revenue & Profit Trends</h3>
            <p>Monthly performance over time</p>
          </div>
          <div className="chart-container">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value) {
                        return '$' + value;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* User Growth Area Chart */}
        <div className="chart-card medium">
          <div className="chart-header">
            <h3>User Growth</h3>
            <p>New users vs total users</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="#4CAF50"
                  fill="#4CAF50"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  stackId="1"
                  stroke="#2196F3"
                  fill="#2196F3"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="chart-card medium">
          <div className="chart-header">
            <h3>Category Distribution</h3>
            <p>Products by category</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bid Status Chart */}
        <div className="chart-card small">
          <div className="chart-header">
            <h3>Bid Status</h3>
            <p>Current bid distribution</p>
          </div>
          <div className="chart-container">
            <Doughnut
              data={bidStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' as const },
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="tables-grid">
        {/* Top Sellers */}
        <div className="data-table-card">
          <div className="table-header">
            <h3>🏆 Top Sellers</h3>
            <button className="btn btn-sm btn-secondary">View All</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topSellers.map((seller, index) => (
                  <tr key={index}>
                    <td className="seller-name">
                      <div className="seller-avatar">{seller.name.charAt(0)}</div>
                      {seller.name}
                    </td>
                    <td>{seller.sales}</td>
                    <td className="revenue">{formatCurrency(seller.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="data-table-card">
          <div className="table-header">
            <h3>📈 Recent Activities</h3>
            <button className="btn btn-sm btn-secondary">View All</button>
          </div>
          <div className="activities-list">
            {analytics.recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'bid' ? '💰' :
                    activity.type === 'product' ? '📦' : '👤'}
                </div>
                <div className="activity-content">
                  <p><strong>{activity.user}</strong> {activity.action}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;