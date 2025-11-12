import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import EmployeesPage from './pages/EmployeesPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/employees" element={<EmployeesPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 Employee Management System. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
