import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import SynchronyLogo from '../../assets/SynchronyLogo';
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

  // Get user initials from full name
  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    const firstInitial = names[0].charAt(0).toUpperCase();
    const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  };

  // Don't show header on admin login page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <SynchronyLogo width="180" height="40" />
        </div>
        {isAuthenticated && (
          <div className="header-user-section">
            <div className="header-user-info">
              <div className="header-user-avatar">
                {getInitials(currentUser?.full_name)}
              </div>
              <span className="header-user-name">
                {currentUser?.full_name}
              </span>
            </div>
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
