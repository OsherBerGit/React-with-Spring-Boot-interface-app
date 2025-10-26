import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { decodeJwt } from 'jose';

const TokenWrapper = ({ children }) => {
  const history = useHistory();

  useEffect(() => {
    const checkTokens = async () => {
      const accessToken = sessionStorage.getItem('accessToken');
      const refreshToken = sessionStorage.getItem('refreshToken');

      const isAccessTokenValid = (token) => {
        if (!token) return false;
        try {
          const decodedToken = decodeJwt(token);
          const expiryTime = decodedToken.exp * 1000;
          return new Date().getTime() < expiryTime;
        } catch (error) {
          return false;
        }
      };

      if (!isAccessTokenValid(accessToken)) {
        if (refreshToken) {
          try {
            const response = await fetch('/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
              const data = await response.json();
              sessionStorage.setItem('accessToken', data.accessToken);
              sessionStorage.setItem('refreshToken', data.refreshToken);
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (error) {
            sessionStorage.clear();
            history.push('/login');
          }
        } else {
          sessionStorage.clear();
          history.push('/login');
        }
      }
    };

    checkTokens();
  }, [history]);

  return <>{children}</>;
};

export default TokenWrapper;