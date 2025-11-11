import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Employees from './pages/Employees';
import AddEmployee from './pages/AddEmployee';
import EditEmployee from './pages/EditEmployee';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/add" element={<AddEmployee />} />
            <Route path="/employees/edit/:id" element={<EditEmployee />} />
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
