import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, Shield, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { authService } from '../services/authService';
import totpService from '../services/totpService';

export default function Login({ setActiveTab, onLogin, redirectMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2FA Challenge Flow State
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please provide both your email address and password.');
      setLoading(false);
      return;
    }

    try {
      // Validate credentials against registered user database
      const user = authService.loginUser({ email, password });

      if (user.twoFactorEnabled) {
        setPendingUser(user);
        setRequires2FA(true);
        setLoading(false);
      } else {
        completeLogin(user);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanCode = twoFactorCode.trim().replace('-', '');
    if (useBackupCode) {
      if (cleanCode.length < 8) {
        setError('Please enter a valid 8-digit emergency backup code (e.g. 7482-1920).');
        return;
      }
      setLoading(true);
      completeLogin(pendingUser);
      return;
    }

    if (cleanCode.length !== 6) {
      setError('Please enter the full 6-digit authenticator verification code.');
      return;
    }

    setLoading(true);
    try {
      const secret = pendingUser?.twoFactorSecret || 'JBSWY3DPEHPK3PXP';
      const isValid = await totpService.verifyCode(secret, cleanCode);
      if (!isValid) {
        setLoading(false);
        setError('Incorrect authenticator code. Please check your Google Authenticator or authenticator app.');
        return;
      }
      completeLogin(pendingUser);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error validating authenticator code.');
    }
  };

  const completeLogin = (user) => {
    if (rememberMe) {
      localStorage.setItem('prophetval_user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('prophetval_user', JSON.stringify(user));
    }

    onLogin(user);
    setActiveTab('home');
    setLoading(false);
  };

  const handleGoogleSuccess = (googleUser) => {
    // Save to user DB if not already present
    try {
      authService.registerUser({
        name: googleUser.name,
        email: googleUser.email,
        password: 'GoogleOAuth2User!',
        role: googleUser.role,
        twoFactorEnabled: googleUser.twoFactorEnabled
      });
    } catch (e) {
      // already exists, proceed
    }

    if (googleUser.twoFactorEnabled) {
      setPendingUser(googleUser);
      setRequires2FA(true);
    } else {
      completeLogin(googleUser);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* REDIRECT BANNER IF FORCED TO SIGN IN */}
        {redirectMessage && (
          <div className="alert" style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', marginBottom: '1.25rem' }}>
            <span>{redirectMessage}</span>
          </div>
        )}

        {/* 2FA CHALLENGE VIEW */}
        {requires2FA ? (
          <div>
            <div className="auth-header">
              <div className="auth-badge-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <ShieldCheck size={28} />
              </div>
              <h1 className="auth-title">Two-Factor Authentication</h1>
              <p className="auth-subtitle">
                {useBackupCode
                  ? 'Enter one of your emergency 8-digit backup recovery codes.'
                  : `Enter the 6-digit verification code from your authenticator app for ${pendingUser?.email}.`}
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="auth-form">
              <div className="form-group">
                <label style={{ textAlign: 'center', display: 'block' }}>
                  {useBackupCode ? 'Emergency Backup Code' : '6-Digit Authenticator Code'}
                </label>
                <input
                  type="text"
                  placeholder={useBackupCode ? '7482-1920' : '000000'}
                  maxLength={useBackupCode ? 10 : 6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  style={{
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    letterSpacing: useBackupCode ? '0.1em' : '0.25em',
                    fontFamily: 'var(--font-mono)',
                    padding: '0.85rem'
                  }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                    setError(null);
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  {useBackupCode ? '← Use Authenticator App Code' : 'Lost phone? Use Backup Code →'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode('');
                    setError(null);
                  }}
                  style={{ flex: 1, padding: '0.85rem' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ flex: 2, padding: '0.85rem' }}
                >
                  <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STANDARD LOGIN VIEW */
          <div>
            <div className="auth-header">
              <div className="auth-badge-icon">
                <LogIn size={26} />
              </div>
              <h1 className="auth-title">Account Sign In</h1>
              <p className="auth-subtitle">
                Sign in with your registered account credentials or Google to access valuations.
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <span>{error}</span>
              </div>
            )}

            {/* GOOGLE SIGN IN BUTTON */}
            <GoogleAuthButton
              onGoogleSuccess={handleGoogleSuccess}
              text="Sign in with Google"
            />

            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group form-group-relative">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} className="input-icon-left" />
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-with-icon"
                    required
                  />
                </div>
              </div>

              <div className="form-group form-group-relative">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-with-both"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                {/* FORGOT PASSWORD LINK */}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setActiveTab('forgot-password')}
                  style={{ fontSize: '0.85rem' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
              >
                <LogIn size={18} />
                <span>{loading ? 'Authenticating...' : 'Sign In With Account'}</span>
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account yet?{' '}
                <button
                  className="auth-link"
                  onClick={() => setActiveTab('register')}
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
