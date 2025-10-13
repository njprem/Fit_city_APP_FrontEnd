import { Navigate } from 'react-router-dom';
import { getToken, getUser, logout } from '../services/auth/authService';
import { useState, useEffect, type JSX } from 'react';

const TokenExpiredModal = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2.5rem 2rem',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <h3 style={{
          color: '#d32f2f',
          fontSize: '1.75rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span>⚠️</span> <span>Session Expired</span>
        </h3>
        <p style={{
          fontSize: '1.05rem',
          lineHeight: 1.6,
          color: '#333',
          marginBottom: '0.5rem'
        }}>
          Your session has expired. Please log in again to continue.
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRole }: { children: JSX.Element, allowedRole: string }) => {
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp < Date.now() / 1000) {
          setIsTokenExpired(true);
          setTimeout(() => {
            logout();
            window.location.href = '/';
          }, 3000);
        }
      } catch {
        setIsTokenExpired(true);
        setTimeout(() => {
          logout();
          window.location.href = '/';
        }, 3000);
      }
    }
  }, [token]);

  if (!token || !user) return <Navigate to="/" replace />;

  if (isTokenExpired) {
    return <TokenExpiredModal />;
  }

  if (user.role !== allowedRole) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;