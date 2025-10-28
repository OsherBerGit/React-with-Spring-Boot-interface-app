import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',  // This will be proxied to http://localhost:8080/api
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError(null); // Clear any previous errors
      console.log('Attempting to login with:', { username }); // Don't log password
      
      // Add request logging
      console.log('Sending request to:', '/api/login');
      
      const response = await api.post('/login', { 
        username, 
        password,
        ip: window.location.hostname // Adding IP address as required by backend
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response headers:', response.headers);
      console.log('Login response data:', response.data);
      
      if (response.data.accessToken && response.data.refreshToken) {
        sessionStorage.setItem("accessToken", response.data.accessToken);
        sessionStorage.setItem("refreshToken", response.data.refreshToken);
        console.log("Login successful - tokens stored");
        
        // Add a small delay to ensure tokens are stored
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Navigating to /home');
        navigate('/home', { replace: true });
      } else {
        throw new Error('Invalid response format - missing tokens');
      }
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Full error response:', {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
        
        const errorMessage = err.response.data?.message 
          || err.response.data?.error 
          || JSON.stringify(err.response.data) 
          || 'Server error';
        
        setError(`Login failed (${err.response.status}): ${errorMessage}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.log('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error setting up request:', err);
        setError('Login failed: ' + err.message);
      }
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default Login;