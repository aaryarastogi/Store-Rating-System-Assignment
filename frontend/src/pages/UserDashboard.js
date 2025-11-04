import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '', sortBy: 'name', sortOrder: 'ASC' });
  const [selectedStore, setSelectedStore] = useState(null);
  const [rating, setRating] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.role !== 'normal_user') {
      navigate('/login');
    }
    fetchStores();
  }, [filters]);

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.address) params.append('address', filters.address);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await axios.get(`${API_URL}/user/stores?${params}`);
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const handleRatingClick = (store) => {
    setSelectedStore(store);
    setRating(store.userRating || 0);
  };

  const handleSubmitRating = async () => {
    if (!selectedStore || rating < 1 || rating > 5) {
      setMessage('Please select a rating between 1 and 5');
      return;
    }

    try {
      await axios.post(`${API_URL}/user/ratings`, {
        store_id: selectedStore.id,
        rating: rating,
      });
      setMessage('Rating submitted successfully');
      setSelectedStore(null);
      fetchStores();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting rating');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.put(`${API_URL}/user/password`, passwordForm);
      setMessage('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setShowPasswordModal(false);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating password');
    }
  };

  const handleSort = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setFilters({ ...filters, sortBy: field, sortOrder: newOrder });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <h1>User Dashboard</h1>
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
        <div className="card">
          <h2>Stores</h2>

          <div className="search-filter">
            <input
              type="text"
              placeholder="Search by name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Search by address"
              value={filters.address}
              onChange={(e) => setFilters({ ...filters, address: e.target.value })}
            />
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>Name ↕</th>
                  <th onClick={() => handleSort('address')}>Address ↕</th>
                  <th onClick={() => handleSort('rating')}>Overall Rating ↕</th>
                  <th>Your Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.address || '-'}</td>
                    <td>{store.rating}</td>
                    <td>{store.userRating ? `⭐ ${store.userRating}` : 'Not rated'}</td>
                    <td>
                      <button className="btn btn-primary" onClick={() => handleRatingClick(store)}>
                        {store.userRating ? 'Modify Rating' : 'Submit Rating'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {message && (
          <div className={message.includes('success') ? 'success-message' : 'error-message'} style={{ marginTop: '20px' }}>
            {message}
          </div>
        )}

        {selectedStore && (
          <div className="modal" onClick={() => setSelectedStore(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Rate {selectedStore.name}</h2>
                <button className="close-btn" onClick={() => setSelectedStore(null)}>×</button>
              </div>
              <div>
                <p>Select your rating (1-5):</p>
                <div className="rating-stars" style={{ marginTop: '20px', marginBottom: '20px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= rating ? '' : 'empty'}`}
                      onClick={() => setRating(star)}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <p>Selected Rating: {rating}</p>
                <button className="btn btn-primary" onClick={handleSubmitRating} style={{ marginTop: '20px' }}>
                  {selectedStore.userRating ? 'Update Rating' : 'Submit Rating'}
                </button>
              </div>
            </div>
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

export default UserDashboard;

