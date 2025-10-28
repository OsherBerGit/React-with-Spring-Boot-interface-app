import React, { useState } from 'react';
import axios from 'axios';
import { decodeJwt } from 'jose';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

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

  const isAdmin = getRoles().includes('ADMIN');

  // Logout
  const handleLogout = async () => {
    try {
      await axios.post('/logout', null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      sessionStorage.clear();
      navigate('/login'); // הפניה לדף התחברות
    } catch (err) {
      setError('Logout failed. Please try again.');
      console.error(err);
    }
  };

  // Fetch protected message
  const fetchMessage = async () => {
    try {
      const response = await axios.get('/api/protected-message', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMessage(response.data);
    } catch (err) {
      setError('Failed to fetch message.');
      console.error(err);
    }
  };

  // Fetch admin message
  const fetchAdminMessage = async () => {
    if (!isAdmin) {
      setError('Access denied: Admin only');
      return;
    }
    try {
      const response = await axios.get('/api/protected-message-admin', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMessage(response.data);
    } catch (err) {
      setError('Failed to fetch admin message.');
      console.error(err);
    }
  };

  // CRUD actions
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/api', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    }
  };

  const createUser = async () => {
    if (!isAdmin) {
      setError('Access denied: Admin only');
      return;
    }
    try {
      const response = await axios.post(
        '/api',
        { username: 'newuser', password: 'pass123' }, // דוגמה
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setUsers([...users, response.data]);
    } catch (err) {
      setError('Failed to create user.');
      console.error(err);
    }
  };

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <button onClick={handleLogout}>Logout</button>
      <hr />
      <button onClick={fetchMessage}>Fetch Protected Message</button>
      {isAdmin && <button onClick={fetchAdminMessage}>Fetch Admin Message</button>}
      <hr />
      <button onClick={fetchAllUsers}>Get All Users</button>
      {isAdmin && <button onClick={createUser}>Create User</button>}
      <hr />
      {message && <p>Message: {message}</p>}
      {users.length > 0 && (
        <div>
          <h3>Users:</h3>
          <ul>
            {users.map((user) => (
              <li key={user.id}>{user.username}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Home;
