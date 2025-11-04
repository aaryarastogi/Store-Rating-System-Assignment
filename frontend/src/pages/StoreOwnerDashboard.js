import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const StoreOwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.role !== 'store_owner') {
      navigate('/login');
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/store-owner/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setMessage(error.response?.data?.message || 'Error loading dashboard');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.put(`${API_URL}/store-owner/password`, passwordForm);
      setMessage('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setShowPasswordModal(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating password');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>Store Owner Dashboard</h1>
          <div className="header-actions">
            <span>Welcome, {user?.name}</span>
            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
              Update Password
            </button>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {dashboardData && (
          <>
            <div className="card">
              <h2>Store Information</h2>
              <p><strong>Name:</strong> {dashboardData.store.name}</p>
              <p><strong>Email:</strong> {dashboardData.store.email}</p>
              <p><strong>Address:</strong> {dashboardData.store.address || '-'}</p>
            </div>

            <div className="card">
              <h2>Store Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{dashboardData.averageRating}</h3>
                  <p>Average Rating</p>
                </div>
                <div className="stat-card">
                  <h3>{dashboardData.totalRatings}</h3>
                  <p>Total Ratings</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Users Who Rated This Store</h2>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Rating</th>
                      <th>Rated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.users.length > 0 ? (
                      dashboardData.users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.address || '-'}</td>
                          <td>⭐ {user.rating}</td>
                          <td>{new Date(user.ratedAt).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No ratings yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {message && (
          <div className={message.includes('success') ? 'success-message' : 'error-message'} style={{ marginTop: '20px' }}>
            {message}
          </div>
        )}

        {showPasswordModal && (
          <div className="modal" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Update Password</h2>
                <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password (8-16 chars, 1 uppercase, 1 special char)</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;