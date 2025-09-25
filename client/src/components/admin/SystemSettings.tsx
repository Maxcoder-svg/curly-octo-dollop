import React from 'react';

const SystemSettings: React.FC = () => {
  return (
    <div className="admin-section">
      <h2>System Settings</h2>
      <p>System settings configuration will be implemented here.</p>
      <p>Settings categories will include:</p>
      <ul>
        <li>Bidding settings (period, validity)</li>
        <li>Notification settings (Twilio, EmailJS)</li>
        <li>Payment settings (Paystack)</li>
        <li>Media settings (Cloudinary)</li>
        <li>Authentication settings (Firebase)</li>
      </ul>
    </div>
  );
};

export default SystemSettings;