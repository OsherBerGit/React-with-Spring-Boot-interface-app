import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { decodeJwt } from 'jose';
import { useNavigate } from 'react-router-dom';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

const Home = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    roles: '' // comma-separated roles input (e.g. "ROLE_USER,ROLE_ADMIN")
  });

  const accessToken = sessionStorage.getItem('accessToken');

  // Helper to get roles from JWT
  const getRoles = () => {
    if (!accessToken) return [];
    try {
      const decoded = decodeJwt(accessToken);
      return decoded.roles || [];
    } catch {
      return [];
    }
  };

  const isAdmin = getRoles().includes('ROLE_ADMIN');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      
      // // Provide more detailed error information for debugging
      // const status = err.response?.status;
      // const data = err.response?.data;
      // console.log('Fetch users response status:', status);
      // console.log('Fetch users response data:', data);
      // if (status === 401) setError('Unauthorized (401) - missing or invalid token');
      // else if (status === 403) setError('Forbidden (403) - insufficient permissions');
      // else setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Create new user (Admin only)
  const createUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        username: formData.username,
        password: formData.password,
        roles: formData.roles ? formData.roles.split(',').map(r => r.trim()).filter(Boolean) : []
      };
      const response = await api.post('/users', payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsers([...users, response.data]);
      setFormData({ username: '', password: '', roles: '' });
      setError('');
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Update user (Admin only)
  const updateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedUser) {
      setError('Admin access required and user must be selected');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        username: formData.username,
        // send password only if provided
        ...(formData.password ? { password: formData.password } : {}),
        roles: formData.roles ? formData.roles.split(',').map(r => r.trim()).filter(Boolean) : []
      };
      const response = await api.put(`/users/${selectedUser.id}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsers(users.map(user => 
        user.id === selectedUser.id ? response.data : user
      ));
      setSelectedUser(null);
      setFormData({ username: '', password: '', roles: '' });
      setError('');
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user (Admin only)
  const deleteUser = async (userId) => {
    if (!isAdmin) {
      setError('Admin access required');
      return;
    }
    try {
      setLoading(true);
      await api.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsers(users.filter(user => user.id !== userId));
      setError('');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Select user for editing
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't prefill password
      roles: user.roles ? (Array.isArray(user.roles) ? user.roles.join(',') : Array.from(user.roles).join(',')) : ''
    });
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', null, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      sessionStorage.clear();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed');
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Debug function to show token info
  const debugTokenInfo = () => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return { roles: [], headers: 'No token found' };
    try {
      const decoded = decodeJwt(token);
      return {
        roles: decoded.roles || [],
        headers: `Bearer ${token.substring(0, 15)}...`
      };
    } catch (e) {
      return { roles: [], headers: 'Invalid token' };
    }
  };

  const tokenInfo = debugTokenInfo();

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>User Management</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>

      {error && (
        <div className="error-msg">Error: {error}</div>
      )}

      {isAdmin && (
        <div className="admin-panel">
          <h2>{selectedUser ? 'Update User' : 'Create New User'}</h2>
          <form onSubmit={selectedUser ? updateUser : createUser}>
            <div className="form-row">
              <input
                className="text-input"
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
              />
              <input
                className="text-input"
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <input
                className="roles-input"
                type="text"
                name="roles"
                placeholder="Roles (comma separated, e.g. ROLE_USER,ROLE_ADMIN)"
                value={formData.roles}
                onChange={handleInputChange}
              />
              <button type="submit" className="primary-button">
                {selectedUser ? 'Update' : 'Create'}
              </button>
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData({ username: '', password: '', roles: '' });
                  }}
                  className="secondary-button"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Users List</h2>
          <button 
            onClick={fetchUsers} 
            className="action-button" 
            style={{ marginLeft: 'auto' }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Users'}
          </button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card" onClick={() => isAdmin && handleSelectUser(user)}>
                <h3>{user.username}</h3>
                <div className="user-id">ID: {user.id}</div>
                <div className="user-roles">
                  {user.roles ? (Array.isArray(user.roles) ? user.roles.join(', ') : String(user.roles)) : ''}
                </div>
                {isAdmin && (
                  <div className="card-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleSelectUser(user); }} className="action-button">
                      Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }} className="danger-button">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;