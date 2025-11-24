import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import authService from '../services/authService';
import './SettingsPage.css';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [currentDb, setCurrentDb] = useState('mysql');
  const [selectedDb, setSelectedDb] = useState('mysql');
  const [dbStatus, setDbStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showInitDialog, setShowInitDialog] = useState(false);

  useEffect(() => {
    fetchDatabaseSettings();
    fetchDatabaseStatus();
  }, []);

  const fetchDatabaseSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/settings/database', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCurrentDb(data.data.currentDatabase);
        setSelectedDb(data.data.currentDatabase);
      } else {
        setError(data.message || 'Failed to load database settings');
      }
    } catch (err) {
      setError('Error fetching database settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/database/status', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDbStatus(data.data);
      }
    } catch (err) {
      console.error('Error fetching database status:', err);
    }
  };

  const handleDatabaseChange = () => {
    if (selectedDb !== currentDb) {
      setShowConfirmDialog(true);
    }
  };

  const confirmDatabaseChange = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch('http://localhost:5000/api/settings/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ dbType: selectedDb })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setCurrentDb(selectedDb);
        setShowConfirmDialog(false);
      } else {
        setError(data.message || 'Failed to update database settings');
      }
    } catch (err) {
      setError('Error updating database settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeSqlite = async () => {
    try {
      setInitializing(true);
      setError('');
      setSuccess('');

      const response = await fetch('http://localhost:5000/api/settings/database/initialize-sqlite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('SQLite database initialized successfully!');
        setShowInitDialog(false);
      } else {
        setError(data.message || 'Failed to initialize SQLite database');
      }
    } catch (err) {
      setError('Error initializing SQLite database');
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <ProgressSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>System Settings</h1>
        <p>Configure system-wide settings and preferences</p>
      </div>

      <Card title="Database Configuration" className="settings-card">
        {error && (
          <Message severity="error" text={error} style={{ marginBottom: '1rem', width: '100%' }} />
        )}
        {success && (
          <Message severity="success" text={success} style={{ marginBottom: '1rem', width: '100%' }} />
        )}

        <div className="settings-section">
          <h3>Current Database</h3>
          <div className="db-status">
            <div className="status-badge">
              <i className={`pi ${dbStatus?.status === 'connected' ? 'pi-check-circle' : 'pi-times-circle'}`}
                 style={{ color: dbStatus?.status === 'connected' ? 'green' : 'red', marginRight: '0.5rem' }}></i>
              <span>{dbStatus?.message || 'Checking connection...'}</span>
            </div>
            <div className="current-db-display">
              <strong>Active Database:</strong> {currentDb.toUpperCase()}
            </div>
          </div>

          <Divider />

          <h3>Select Database Type</h3>
          <div className="db-options">
            <div className="db-option">
              <RadioButton
                inputId="mysql"
                name="database"
                value="mysql"
                onChange={(e) => setSelectedDb(e.value)}
                checked={selectedDb === 'mysql'}
              />
              <label htmlFor="mysql" className="ml-2">
                <div className="option-content">
                  <strong>MySQL</strong>
                  <p>Traditional relational database management system</p>
                  <ul>
                    <li>Production-ready and scalable</li>
                    <li>Requires separate server installation</li>
                    <li>Better for multi-user environments</li>
                  </ul>
                </div>
              </label>
            </div>

            <div className="db-option">
              <RadioButton
                inputId="sqlite"
                name="database"
                value="sqlite"
                onChange={(e) => setSelectedDb(e.value)}
                checked={selectedDb === 'sqlite'}
              />
              <label htmlFor="sqlite" className="ml-2">
                <div className="option-content">
                  <strong>SQLite</strong>
                  <p>Lightweight file-based database</p>
                  <ul>
                    <li>No separate server required</li>
                    <li>Great for development and testing</li>
                    <li>Portable database file</li>
                  </ul>
                </div>
              </label>
            </div>
          </div>

          <div className="settings-actions">
            <Button
              label="Apply Changes"
              icon="pi pi-check"
              onClick={handleDatabaseChange}
              disabled={selectedDb === currentDb}
              className="p-button-primary"
            />
            {selectedDb === 'sqlite' && (
              <Button
                label="Initialize SQLite Database"
                icon="pi pi-database"
                onClick={() => setShowInitDialog(true)}
                className="p-button-secondary"
              />
            )}
            <Button
              label="Refresh Status"
              icon="pi pi-refresh"
              onClick={fetchDatabaseStatus}
              className="p-button-outlined"
            />
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        header="Confirm Database Change"
        visible={showConfirmDialog}
        style={{ width: '450px' }}
        onHide={() => setShowConfirmDialog(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowConfirmDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Confirm"
              icon="pi pi-check"
              onClick={confirmDatabaseChange}
              loading={saving}
              autoFocus
            />
          </div>
        }
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '3rem', color: 'orange' }}></i>
          <p>
            Are you sure you want to switch from <strong>{currentDb.toUpperCase()}</strong> to{' '}
            <strong>{selectedDb.toUpperCase()}</strong>?
          </p>
          <Message
            severity="warn"
            text="The server must be restarted for this change to take effect."
          />
        </div>
      </Dialog>

      {/* Initialize SQLite Dialog */}
      <Dialog
        header="Initialize SQLite Database"
        visible={showInitDialog}
        style={{ width: '450px' }}
        onHide={() => setShowInitDialog(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowInitDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Initialize"
              icon="pi pi-check"
              onClick={handleInitializeSqlite}
              loading={initializing}
              autoFocus
            />
          </div>
        }
      >
        <div className="confirmation-content">
          <i className="pi pi-info-circle" style={{ fontSize: '3rem', color: 'blue' }}></i>
          <p>This will create a new SQLite database with the default schema and sample data.</p>
          <Message
            severity="info"
            text="Default admin credentials will be: admin / admin123"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
