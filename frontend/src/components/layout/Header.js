import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  // Don't show header on admin login page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          TeamPulse
        </div>
        {isAuthenticated && (
          <div className="header-user-section">
            <span className="header-user-name">
              Welcome, {currentUser?.full_name}
            </span>
            <button onClick={handleLogout} className="header-logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
