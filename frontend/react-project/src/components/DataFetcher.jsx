import React, { useState, useEffect } from 'react';
import TokenWrapper from './TokenWrapper';
import { apiService } from '../services/apiService';

const DataFetcher = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId;

    const fetchData = async () => {
      try {
        const accessToken = sessionStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('No access token available');
        }

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error('Request timeout'));
          }, 10000); // 10 second timeout
        });

        // Create the fetch promise
        const fetchPromise = fetch(`${API_BASE_URL}/protected-data`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        // Race between timeout and fetch
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request was cancelled or timed out');
        } else {
          setError(err.message || 'Failed to fetch data');
        }
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [API_BASE_URL]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Fetched Data:</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const WrappedComponent = () => {
  return (
    <TokenWrapper>
      <DataFetcher />
    </TokenWrapper>
  );
};

export default WrappedComponent;