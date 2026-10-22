import React from 'react';
import { Lock, LogIn, UserPlus, ArrowLeft, Sparkles, Shield } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';

export default function AuthGuard({ featureName = "this valuation workspace", setActiveTab, onLogin }) {
  const handleGoogleSuccess = (googleUser) => {
    localStorage.setItem('prophetval_user', JSON.stringify(googleUser));
    onLogin(googleUser);
    setActiveTab('home');
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: '60vh' }}>
      <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(59, 130, 246, 0.12)',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <Lock size={30} />
        </div>

        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--heading-color)', marginBottom: '0.6rem' }}>
          Account Sign-In Required
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          Users must sign in with their account to access <strong>{featureName}</strong>, run live Machine Learning valuations, and inspect historical audit records.
        </p>

        {/* Quick Google Sign In */}
        <div style={{ marginBottom: '1.25rem' }}>
          <GoogleAuthButton
            onGoogleSuccess={handleGoogleSuccess}
            text="Continue with Google"
          />
        </div>

        <div className="auth-divider">
          <span>or use your ProphetVal account</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('login')}
            style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogIn size={18} />
            <span>Sign In to Your Account</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => setActiveTab('register')}
            style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} />
            <span>Register New Account</span>
          </button>

          <button
            className="auth-link"
            onClick={() => setActiveTab('landing')}
            style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-dim)' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Public Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}

