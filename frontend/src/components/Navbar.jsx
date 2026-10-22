import React from 'react';
import { Home, LineChart, Calculator, History, LogOut, Compass, Sun, Moon, User, ShieldCheck, Lock } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  apiOnline,
  user,
  onLogout,
  theme,
  toggleTheme,
}) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a
          href="#landing"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab(user ? 'home' : 'landing');
          }}
          className="brand"
        >
          <div className="brand-icon">
            <Home size={22} />
          </div>
          <span>ProphetVal</span>
        </a>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${activeTab === 'landing' ? 'active' : ''}`}
              onClick={() => setActiveTab('landing')}
            >
              <Compass size={18} />
              <span>Explore</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={18} />
              <span>Home Hub</span>
              {!user && <Lock size={12} style={{ opacity: 0.6, marginLeft: '2px' }} />}
            </button>
          </li>

          <li>
            <button
              className={`nav-link ${activeTab === 'predict' ? 'active' : ''}`}
              onClick={() => setActiveTab('predict')}
            >
              <Calculator size={18} />
              <span>Predict Price</span>
              {!user && <Lock size={12} style={{ opacity: 0.6, marginLeft: '2px' }} />}
            </button>
          </li>

          <li>
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LineChart size={18} />
              <span>Dashboard</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={18} />
              <span>History</span>
              {!user && <Lock size={12} style={{ opacity: 0.6, marginLeft: '2px' }} />}
            </button>
          </li>

          {user && (
            <li>
              <button
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                <span>Profile & 2FA</span>
              </button>
            </li>
          )}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'light' ? (
              <>
                <Moon size={17} />
                <span className="theme-toggle-label">Dark</span>
              </>
            ) : (
              <>
                <Sun size={17} />
                <span className="theme-toggle-label">Light</span>
              </>
            )}
          </button>

          {/* User Auth or Sign In */}
          {user ? (
            <div
              className={`nav-user-pill ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
              title="View Profile, Security & 2FA Settings"
              style={{ cursor: 'pointer' }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="user-avatar-circle"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="user-avatar-circle">
                  {user.avatarInitial || user.name?.charAt(0) || 'U'}
                </div>
              )}
              <span className="user-name-text">{user.name}</span>
              {user.twoFactorEnabled && (
                <ShieldCheck size={15} color="#10b981" title="2FA Protected" />
              )}
              <button
                className="btn-signout"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                title="Sign out of ProphetVal"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <button
                className={`btn-nav-login ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                className={`btn-nav-register ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
