import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '', sortBy: 'name', sortOrder: 'ASC' });
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: '', sortBy: 'name', sortOrder: 'ASC' });
  const [storeForm, setStoreForm] = useState({ name: '', email: '', address: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', address: '', role: 'normal_user', store_id: '' });

  useEffect(() => {
    if (user?.role !== 'system_administrator') {
      navigate('/login');
    }
    fetchDashboard();
  }, [activeTab, storeFilters, userFilters]);

  const fetchDashboard = async () => {
    if (activeTab === 'dashboard') {
      try {
        const response = await axios.get(`${API_URL}/admin/dashboard`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }
    } else if (activeTab === 'stores') {
      fetchStores();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  };

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams();
      if (storeFilters.name) params.append('name', storeFilters.name);
      if (storeFilters.email) params.append('email', storeFilters.email);
      if (storeFilters.address) params.append('address', storeFilters.address);
      params.append('sortBy', storeFilters.sortBy);
      params.append('sortOrder', storeFilters.sortOrder);

      const response = await axios.get(`${API_URL}/admin/stores?${params}`);
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userFilters.name) params.append('name', userFilters.name);
      if (userFilters.email) params.append('email', userFilters.email);
      if (userFilters.address) params.append('address', userFilters.address);
      if (userFilters.role) params.append('role', userFilters.role);
      params.append('sortBy', userFilters.sortBy);
      params.append('sortOrder', userFilters.sortOrder);

      const response = await axios.get(`${API_URL}/admin/users?${params}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${API_URL}/admin/stores`, storeForm);
      setMessage('Store added successfully');
      setStoreForm({ name: '', email: '', address: '' });
      setShowAddStoreModal(false);
      fetchStores();
      fetchDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding store');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const data = { ...userForm };
      if (!data.store_id) delete data.store_id;
      await axios.post(`${API_URL}/admin/users`, data);
      setMessage('User added successfully');
      setUserForm({ name: '', email: '', password: '', address: '', role: 'normal_user', store_id: '' });
      setShowAddUserModal(false);
      fetchUsers();
      fetchDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding user');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/admin/users/${userId}`);
      setSelectedUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleSort = (field, currentTab) => {
    if (currentTab === 'stores') {
      const newOrder = storeFilters.sortBy === field && storeFilters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      setStoreFilters({ ...storeFilters, sortBy: field, sortOrder: newOrder });
    } else {
      const newOrder = userFilters.sortBy === field && userFilters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
      setUserFilters({ ...userFilters, sortBy: field, sortOrder: newOrder });
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
          <h1>Admin Dashboard</h1>
          <div className="header-actions">
            <span>Welcome, {user?.name}</span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'stores' ? 'active' : ''}
            onClick={() => setActiveTab('stores')}
          >
            Stores
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-card">
              <h3>{stats.totalStores}</h3>
              <p>Total Stores</p>
            </div>
            <div className="stat-card">
              <h3>{stats.totalRatings}</h3>
              <p>Total Ratings</p>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Stores</h2>
              <button className="btn btn-primary" onClick={() => setShowAddStoreModal(true)}>
                Add Store
              </button>
            </div>

            <div className="search-filter">
              <input
                type="text"
                placeholder="Filter by name"
                value={storeFilters.name}
                onChange={(e) => setStoreFilters({ ...storeFilters, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by email"
                value={storeFilters.email}
                onChange={(e) => setStoreFilters({ ...storeFilters, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by address"
                value={storeFilters.address}
                onChange={(e) => setStoreFilters({ ...storeFilters, address: e.target.value })}
              />
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name', 'stores')}>Name ↕</th>
                    <th onClick={() => handleSort('email', 'stores')}>Email ↕</th>
                    <th onClick={() => handleSort('address', 'stores')}>Address ↕</th>
                    <th onClick={() => handleSort('rating', 'stores')}>Rating ↕</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td>{store.name}</td>
                      <td>{store.email}</td>
                      <td>{store.address || '-'}</td>
                      <td>{store.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Users</h2>
              <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}>
                Add User
              </button>
            </div>

            <div className="search-filter">
              <input
                type="text"
                placeholder="Filter by name"
                value={userFilters.name}
                onChange={(e) => setUserFilters({ ...userFilters, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by email"
                value={userFilters.email}
                onChange={(e) => setUserFilters({ ...userFilters, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by address"
                value={userFilters.address}
                onChange={(e) => setUserFilters({ ...userFilters, address: e.target.value })}
              />
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="system_administrator">Admin</option>
                <option value="normal_user">Normal User</option>
                <option value="store_owner">Store Owner</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name', 'users')}>Name ↕</th>
                    <th onClick={() => handleSort('email', 'users')}>Email ↕</th>
                    <th onClick={() => handleSort('address', 'users')}>Address ↕</th>
                    <th onClick={() => handleSort('role', 'users')}>Role ↕</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.address || '-'}</td>
                      <td>{u.role}</td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => handleViewUser(u.id)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {message && (
          <div className={message.includes('success') ? 'success-message' : 'error-message'} style={{ marginTop: '20px' }}>
            {message}
          </div>
        )}

        {selectedUser && (
          <div className="modal" onClick={() => setSelectedUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>User Details</h2>
                <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
              </div>
              <div>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Address:</strong> {selectedUser.address || '-'}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                {selectedUser.role === 'store_owner' && selectedUser.rating && (
                  <p><strong>Store Rating:</strong> {selectedUser.rating}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {showAddStoreModal && (
          <div className="modal" onClick={() => setShowAddStoreModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Store</h2>
                <button className="close-btn" onClick={() => setShowAddStoreModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddStore}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Add Store
                </button>
              </form>
            </div>
          </div>
        )}

        {showAddUserModal && (
          <div className="modal" onClick={() => setShowAddUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add User</h2>
                <button className="close-btn" onClick={() => setShowAddUserModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Name (20-60 characters)</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password (8-16 chars, 1 uppercase, 1 special char)</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={userForm.address}
                    onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                    rows="3"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    required
                  >
                    <option value="normal_user">Normal User</option>
                    <option value="system_administrator">System Administrator</option>
                    <option value="store_owner">Store Owner</option>
                  </select>
                </div>
                {userForm.role === 'store_owner' && (
                  <div className="form-group">
                    <label>Store ID (optional, can be set later)</label>
                    <input
                      type="number"
                      value={userForm.store_id}
                      onChange={(e) => setUserForm({ ...userForm, store_id: e.target.value })}
                    />
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Add User
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;