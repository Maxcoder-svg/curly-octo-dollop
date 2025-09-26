import React, { useState, useEffect } from 'react';
import './AdminComponents.css';

interface Settings {
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    serviceSid: string;
  };
  paystack: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    bidDurationDays: number;
    commissionRate: number;
  };
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    cloudinary: {
      cloudName: '',
      apiKey: '',
      apiSecret: '',
      uploadPreset: ''
    },
    twilio: {
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      serviceSid: ''
    },
    paystack: {
      publicKey: '',
      secretKey: '',
      webhookSecret: ''
    },
    general: {
      siteName: 'Auction Marketplace',
      siteUrl: 'https://marketplace.com',
      adminEmail: 'admin@marketplace.com',
      bidDurationDays: 7,
      commissionRate: 5.0
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [testingService, setTestingService] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({ ...settings, ...data });
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error: any) {
      setError('Failed to load settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: keyof Settings, field: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSuccess('Settings saved successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const testService = async (serviceName: 'cloudinary' | 'twilio' | 'paystack') => {
    try {
      setTestingService(serviceName);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/settings/test/${serviceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings[serviceName])
      });

      if (response.ok) {
        setSuccess(`${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} connection test successful!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `${serviceName} test failed`);
      }
    } catch (error: any) {
      setError(`${serviceName} test failed: ` + error.message);
    } finally {
      setTestingService(null);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setSettings({
        cloudinary: {
          cloudName: '',
          apiKey: '',
          apiSecret: '',
          uploadPreset: ''
        },
        twilio: {
          accountSid: '',
          authToken: '',
          phoneNumber: '',
          serviceSid: ''
        },
        paystack: {
          publicKey: '',
          secretKey: '',
          webhookSecret: ''
        },
        general: {
          siteName: 'Auction Marketplace',
          siteUrl: 'https://marketplace.com',
          adminEmail: 'admin@marketplace.com',
          bidDurationDays: 7,
          commissionRate: 5.0
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading-spinner">Loading system settings...</div>
      </div>
    );
  }

  return (
    <div className="system-settings">
      <div className="settings-header">
        <h2>System Settings</h2>
        <p>Configure third-party integrations and system parameters</p>

        <div className="settings-actions">
          <button
            className="btn btn-secondary"
            onClick={resetToDefaults}
            disabled={saving}
          >
            Reset to Defaults
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
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

      {/* Settings Tabs */}
      <div className="settings-tabs">
        {[
          { id: 'general', label: 'General', icon: '⚙️' },
          { id: 'cloudinary', label: 'Cloudinary', icon: '☁️' },
          { id: 'twilio', label: 'Twilio SMS', icon: '📱' },
          { id: 'paystack', label: 'Paystack', icon: '💳' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="settings-content">

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3>General Settings</h3>
            <div className="settings-grid">
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.general.siteName}
                  onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                  placeholder="Your marketplace name"
                />
              </div>

              <div className="form-group">
                <label>Site URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={settings.general.siteUrl}
                  onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                  placeholder="https://yourmarketplace.com"
                />
              </div>

              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={settings.general.adminEmail}
                  onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
                  placeholder="admin@yourmarketplace.com"
                />
              </div>

              <div className="form-group">
                <label>Bid Duration (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.general.bidDurationDays}
                  onChange={(e) => handleInputChange('general', 'bidDurationDays', parseInt(e.target.value))}
                  min="1"
                  max="30"
                />
                <small className="form-help">How long bids remain active</small>
              </div>

              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.general.commissionRate}
                  onChange={(e) => handleInputChange('general', 'commissionRate', parseFloat(e.target.value))}
                  min="0"
                  max="50"
                  step="0.1"
                />
                <small className="form-help">Platform commission percentage</small>
              </div>
            </div>
          </div>
        )}

        {/* Cloudinary Settings */}
        {activeTab === 'cloudinary' && (
          <div className="settings-section">
            <div className="section-header-with-test">
              <div>
                <h3>Cloudinary Configuration</h3>
                <p>Configure image storage and optimization service</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => testService('cloudinary')}
                disabled={testingService === 'cloudinary'}
              >
                {testingService === 'cloudinary' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            <div className="settings-grid">
              <div className="form-group">
                <label>Cloud Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.cloudinary.cloudName}
                  onChange={(e) => handleInputChange('cloudinary', 'cloudName', e.target.value)}
                  placeholder="your-cloud-name"
                />
              </div>

              <div className="form-group">
                <label>API Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.cloudinary.apiKey}
                  onChange={(e) => handleInputChange('cloudinary', 'apiKey', e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div className="form-group">
                <label>API Secret</label>
                <input
                  type="password"
                  className="form-control"
                  value={settings.cloudinary.apiSecret}
                  onChange={(e) => handleInputChange('cloudinary', 'apiSecret', e.target.value)}
                  placeholder="Enter API secret"
                />
              </div>

              <div className="form-group">
                <label>Upload Preset</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.cloudinary.uploadPreset}
                  onChange={(e) => handleInputChange('cloudinary', 'uploadPreset', e.target.value)}
                  placeholder="ml_default"
                />
                <small className="form-help">Unsigned upload preset for direct uploads</small>
              </div>
            </div>

            <div className="service-info">
              <h4>Setup Instructions:</h4>
              <ol>
                <li>Sign up for a Cloudinary account at <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer">cloudinary.com</a></li>
                <li>Go to your Dashboard to find your Cloud Name, API Key, and API Secret</li>
                <li>Create an unsigned upload preset in Settings → Upload</li>
                <li>Enter the details above and test the connection</li>
              </ol>
            </div>
          </div>
        )}

        {/* Twilio Settings */}
        {activeTab === 'twilio' && (
          <div className="settings-section">
            <div className="section-header-with-test">
              <div>
                <h3>Twilio SMS Configuration</h3>
                <p>Configure SMS notifications for bid winners</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => testService('twilio')}
                disabled={testingService === 'twilio'}
              >
                {testingService === 'twilio' ? 'Testing...' : 'Test SMS'}
              </button>
            </div>

            <div className="settings-grid">
              <div className="form-group">
                <label>Account SID</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.twilio.accountSid}
                  onChange={(e) => handleInputChange('twilio', 'accountSid', e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="form-group">
                <label>Auth Token</label>
                <input
                  type="password"
                  className="form-control"
                  value={settings.twilio.authToken}
                  onChange={(e) => handleInputChange('twilio', 'authToken', e.target.value)}
                  placeholder="Enter auth token"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={settings.twilio.phoneNumber}
                  onChange={(e) => handleInputChange('twilio', 'phoneNumber', e.target.value)}
                  placeholder="+1234567890"
                />
                <small className="form-help">Your Twilio phone number</small>
              </div>

              <div className="form-group">
                <label>Service SID (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.twilio.serviceSid}
                  onChange={(e) => handleInputChange('twilio', 'serviceSid', e.target.value)}
                  placeholder="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <small className="form-help">For verification services</small>
              </div>
            </div>

            <div className="service-info">
              <h4>Setup Instructions:</h4>
              <ol>
                <li>Sign up for a Twilio account at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer">twilio.com</a></li>
                <li>Get your Account SID and Auth Token from the Console Dashboard</li>
                <li>Buy a phone number from Twilio Console → Phone Numbers</li>
                <li>Optionally create a Verify Service for phone verification</li>
                <li>Test the configuration to ensure SMS delivery works</li>
              </ol>
            </div>
          </div>
        )}

        {/* Paystack Settings */}
        {activeTab === 'paystack' && (
          <div className="settings-section">
            <div className="section-header-with-test">
              <div>
                <h3>Paystack Payment Configuration</h3>
                <p>Configure payment processing for transactions</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => testService('paystack')}
                disabled={testingService === 'paystack'}
              >
                {testingService === 'paystack' ? 'Testing...' : 'Test API'}
              </button>
            </div>

            <div className="settings-grid">
              <div className="form-group">
                <label>Public Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.paystack.publicKey}
                  onChange={(e) => handleInputChange('paystack', 'publicKey', e.target.value)}
                  placeholder="Enter your public key"
                />
                <small className="form-help">Used for client-side payments</small>
              </div>

              <div className="form-group">
                <label>Secret Key</label>
                <input
                  type="password"
                  className="form-control"
                  value={settings.paystack.secretKey}
                  onChange={(e) => handleInputChange('paystack', 'secretKey', e.target.value)}
                  placeholder="Enter your secret key"
                />
                <small className="form-help">Used for server-side API calls</small>
              </div>

              <div className="form-group">
                <label>Webhook Secret</label>
                <input
                  type="password"
                  className="form-control"
                  value={settings.paystack.webhookSecret}
                  onChange={(e) => handleInputChange('paystack', 'webhookSecret', e.target.value)}
                  placeholder="Enter webhook secret"
                />
                <small className="form-help">For webhook signature verification</small>
              </div>
            </div>

            <div className="service-info">
              <h4>Setup Instructions:</h4>
              <ol>
                <li>Sign up for a Paystack account at <a href="https://paystack.com" target="_blank" rel="noopener noreferrer">paystack.com</a></li>
                <li>Get your Public and Secret keys from Settings → API Keys & Webhooks</li>
                <li>Set up webhooks to receive payment notifications</li>
                <li>Configure your webhook URL: <code>{settings.general.siteUrl}/api/webhooks/paystack</code></li>
                <li>Test the integration with a small transaction</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;