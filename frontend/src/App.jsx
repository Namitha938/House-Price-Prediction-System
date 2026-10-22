import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthGuard from './components/AuthGuard';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import History from './pages/History';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import api from './services/api';
import { signOutFromFirebase } from './services/firebase';

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('prophetval_theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prophetval_user') || sessionStorage.getItem('prophetval_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('prophetval_user');
    return saved ? 'home' : 'landing';
  });

  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('prophetval_theme', theme);
    } catch (e) {
      console.warn('Could not persist theme', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (res && res.status === 'healthy') {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch {
        setApiOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleUpdateUser = (updatedData) => {
    setUser(updatedData);
    try {
      localStorage.setItem('prophetval_user', JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Could not save updated user to localStorage', e);
    }
  };

  const handleLogout = () => {
    signOutFromFirebase();
    localStorage.removeItem('prophetval_user');
    sessionStorage.removeItem('prophetval_user');
    setUser(null);
    setActiveTab('landing');
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiOnline={apiOnline}
        user={user}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="main-content">
        {activeTab === 'landing' && (
          <Landing setActiveTab={setActiveTab} user={user} theme={theme} />
        )}
        {activeTab === 'home' && (
          user ? (
            <Home setActiveTab={setActiveTab} user={user} theme={theme} />
          ) : (
            <AuthGuard featureName="the Personal Valuation Command Center" setActiveTab={setActiveTab} onLogin={handleLogin} />
          )
        )}
        {activeTab === 'predict' && (
          user ? (
            <Predict setActiveTab={setActiveTab} user={user} theme={theme} />
          ) : (
            <AuthGuard featureName="the Real Estate Valuation Engine" setActiveTab={setActiveTab} onLogin={handleLogin} />
          )
        )}
        {activeTab === 'dashboard' && (
          <Dashboard setActiveTab={setActiveTab} user={user} theme={theme} />
        )}
        {activeTab === 'history' && (
          user ? (
            <History setActiveTab={setActiveTab} user={user} theme={theme} />
          ) : (
            <AuthGuard featureName="the Valuation Audit History" setActiveTab={setActiveTab} onLogin={handleLogin} />
          )
        )}
        {activeTab === 'profile' && (
          user ? (
            <Profile
              user={user}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              setActiveTab={setActiveTab}
              theme={theme}
            />
          ) : (
            <AuthGuard featureName="Account Settings & Security" setActiveTab={setActiveTab} onLogin={handleLogin} />
          )
        )}
        {activeTab === 'login' && (
          <Login setActiveTab={setActiveTab} onLogin={handleLogin} theme={theme} />
        )}
        {activeTab === 'register' && (
          <Register setActiveTab={setActiveTab} onLogin={handleLogin} theme={theme} />
        )}
        {activeTab === 'forgot-password' && (
          <ForgotPassword setActiveTab={setActiveTab} theme={theme} />
        )}
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div>
            <strong>ProphetVal AI Valuation System</strong> • Powered by Kaggle Ames Dataset, FastAPI & Scikit-learn
          </div>
          <div className="footer-links">
            <button onClick={() => setActiveTab('landing')}>Explore</button>
            <button onClick={() => setActiveTab('home')}>Home Hub</button>
            <button onClick={() => setActiveTab('predict')}>Predict</button>
            <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            {user && <button onClick={() => setActiveTab('profile')}>Profile & Security</button>}
          </div>
        </div>
      </footer>
    </div>
  );
}
