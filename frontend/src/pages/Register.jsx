import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { authService } from '../services/authService';

export default function Register({ setActiveTab, onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Real Estate Investor');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enable2FA, setEnable2FA] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roles = [
    'Real Estate Investor',
    'Residential Appraiser',
    'Homeowner / Buyer',
    'Mortgage / Lending Specialist',
    'Data Scientist / ML Researcher'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required registration fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the ProphetVal Terms of Service.');
      return;
    }

    setLoading(true);

    try {
      const newUser = authService.registerUser({
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: role,
        twoFactorEnabled: enable2FA
      });

      localStorage.setItem('prophetval_user', JSON.stringify(newUser));
      onLogin(newUser);
      setActiveTab('home');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (googleUser) => {
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

    localStorage.setItem('prophetval_user', JSON.stringify(googleUser));
    onLogin(googleUser);
    setActiveTab('home');
  };

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(password);

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-badge-icon">
            <UserPlus size={26} />
          </div>
          <h1 className="auth-title">Create Free Account</h1>
          <p className="auth-subtitle">
            Join ProphetVal to save custom property portfolios, run ML predictions, and view market insights.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <span>{error}</span>
          </div>
        )}

        {/* GOOGLE SIGN UP BUTTON */}
        <GoogleAuthButton
          onGoogleSuccess={handleGoogleSuccess}
          text="Sign up with Google"
          isSignUp={true}
        />

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group form-group-relative">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} className="input-icon-left" />
              <input
                type="text"
                placeholder="Jordan Hayes"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-with-icon"
                required
              />
            </div>
          </div>

          <div className="form-group form-group-relative">
            <label>Work or Personal Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} className="input-icon-left" />
              <input
                type="email"
                placeholder="jordan@valuationpro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-with-icon"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Primary Role / Interest</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group form-group-relative">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 chars"
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

            <div className="form-group form-group-relative">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-with-icon"
                  required
                />
              </div>
            </div>
          </div>

          {password && (
            <div style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-dim)' }}>
                <span>Password Strength</span>
                <span style={{ fontWeight: 600, color: strength <= 2 ? '#ef4444' : strength <= 3 ? '#f59e0b' : '#10b981' }}>
                  {strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px', height: '3px' }}>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    style={{
                      flex: 1,
                      borderRadius: '2px',
                      background: lvl <= strength
                        ? (strength <= 2 ? '#ef4444' : strength <= 3 ? '#f59e0b' : '#10b981')
                        : 'var(--border-color)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2FA Opt-in Checkbox */}
          <label className="checkbox-label" style={{ fontSize: '0.85rem', color: 'var(--text-main)', padding: '0.5rem 0' }}>
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(e) => setEnable2FA(e.target.checked)}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="#3b82f6" />
              <span>Enable Two-Factor Authentication (2FA) for this account</span>
            </span>
          </label>

          <label className="checkbox-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>I agree to the ProphetVal Terms of Service and Privacy Policy</span>
          </label>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            <UserPlus size={18} />
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              className="auth-link"
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
