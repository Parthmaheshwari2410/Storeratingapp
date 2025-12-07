
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';

import Navbar from './component/Navbar';
import Signup from './pages/Signup';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading..</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
          />

          <Route
            path="/signup"
            element={user ? <Navigate to="/" /> : <Signup />}
          />

          <Route
            path="/"
            element={
              !user ? <Navigate to="/login" /> :
                user.role === 'admin' ? <Navigate to="/admin" /> :
                  user.role === 'store_owner' ? <Navigate to="/store-owner" /> :
                    <Dashboard user={user} />
            }
          />

          <Route
            path="/admin"
            element={
              !user ? <Navigate to="/login" /> :
                user.role !== 'admin' ? <Navigate to="/" /> :
                  <AdminDashboard />
            }
          />

          <Route
            path="/store-owner"
            element={
              !user ? <Navigate to="/login" /> :
                user.role !== 'store_owner' ? <Navigate to="/" /> :
                  <StoreOwnerDashboard user={user} />
            }
          />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;