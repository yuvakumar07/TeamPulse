import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to TeamPulse</h1>
        <p>Your comprehensive employee management solution</p>
        <p className="hero-subtitle">Secure, efficient, and powerful workforce management</p>
        <div className="hero-actions">
          <Link to="/" className="btn btn-primary-large">
            Admin Login
          </Link>
        </div>
      </section>

      <section className="stats-section">
        <h2>Why TeamPulse?</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-label">Secure Access</div>
            <p className="stat-description">JWT-based authentication with role-based access control</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Real-time Analytics</div>
            <p className="stat-description">Comprehensive dashboard with employee statistics and insights</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <div className="stat-label">Advanced Search</div>
            <p className="stat-description">Powerful filtering and sorting capabilities</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-label">Audit Logging</div>
            <p className="stat-description">Complete activity tracking and audit trails</p>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>🔐 Secure Authentication</h3>
            <p>JWT-based admin authentication with encrypted passwords and session management</p>
          </div>
          <div className="feature-card">
            <h3>👥 Employee Management</h3>
            <p>Complete CRUD operations for employee records with advanced filtering and sorting</p>
          </div>
          <div className="feature-card">
            <h3>👨‍💼 Admin User Management</h3>
            <p>Create and manage administrator accounts with role-based permissions</p>
          </div>
          <div className="feature-card">
            <h3>📊 Analytics Dashboard</h3>
            <p>Comprehensive insights with employee statistics, role distribution, and trends</p>
          </div>
          <div className="feature-card">
            <h3>📋 Audit Logging</h3>
            <p>Track all admin actions with detailed logs including timestamps and IP addresses</p>
          </div>
          <div className="feature-card">
            <h3>📱 Responsive Design</h3>
            <p>Seamless experience across desktop, tablet, and mobile devices</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Access the admin panel to manage your workforce efficiently</p>
        <Link to="/" className="btn btn-primary-large">
          Go to Admin Panel
        </Link>
      </section>
    </div>
  );
};

export default Home;
