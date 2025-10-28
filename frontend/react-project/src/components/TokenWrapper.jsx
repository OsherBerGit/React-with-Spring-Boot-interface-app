import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeJwt } from 'jose';

const TokenWrapper = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  const isAccessTokenValid = (token) => {
    if (!token) return false;
    try {
      const decodedToken = decodeJwt(token);
      const expiryTime = decodedToken.exp * 1000;
      // Add 5 seconds buffer to prevent edge cases
      return new Date().getTime() < (expiryTime - 5000);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const checkTokens = async () => {
      try {
        setIsLoading(true);
        const accessToken = sessionStorage.getItem('accessToken');
        const refreshToken = sessionStorage.getItem('refreshToken');

        if (!isAccessTokenValid(accessToken)) {
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await fetch(`${API_BASE_URL}/refresh-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ refreshToken }),
            signal: controller.signal
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Token refresh failed');
          }

          const data = await response.json();
          if (isMounted) {
            sessionStorage.setItem('accessToken', data.accessToken);
            sessionStorage.setItem('refreshToken', data.refreshToken);
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        
        console.error('Token refresh error:', error);
        sessionStorage.clear();
        if (isMounted) {
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkTokens();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, API_BASE_URL]);

  return (
    <>
      {isLoading ? (
        <div className="loading-center">Loading...</div>
      ) : (
        children
      )}
    </>
  );
};

export default TokenWrapper;