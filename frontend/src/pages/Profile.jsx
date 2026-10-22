import React, { useState } from 'react';
import {
  User,
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Calendar,
  Layers,
  X,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { authService } from '../services/authService';
import totpService from '../services/totpService';

export default function Profile({ user, onUpdateUser, onLogout, setActiveTab }) {
  const [activeTab, setActiveProfileTab] = useState('general'); // 'general' | 'security' | 'stats'
  
  // General Profile State
  const [name, setName] = useState(user?.name || 'Valuation Analyst');
  const [email, setEmail] = useState(user?.email || 'analyst@prophetval.io');
  const [role, setRole] = useState(user?.role || 'Senior Portfolio Analyst');
  const [phone, setPhone] = useState(user?.phone || '+1 (515) 294-4111');
  const [location, setLocation] = useState(user?.location || 'Ames, Iowa');
  const [bio, setBio] = useState(user?.bio || 'Real estate professional focused on Machine Learning valuations and Ames housing market trends.');
  const [organization, setOrganization] = useState(user?.organization || 'ProphetVal Valuation Network');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(1); // 1: QR setup, 2: backup codes
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [secretKey, setSecretKey] = useState(user?.twoFactorSecret || 'JBSWY3DPEHPK3PXP');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  
  // Feedback Messages
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const backupCodes = [
    '7482-1920', '4829-1092', '9102-3841', '5819-2041',
    '3041-9284', '8192-3019', '1940-5821', '6291-0482'
  ];

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const updatedUser = {
      ...user,
      name,
      email,
      role,
      phone,
      location,
      bio,
      organization,
      avatarUrl,
      avatarInitial: name.charAt(0).toUpperCase(),
      twoFactorEnabled
    };

    onUpdateUser(updatedUser);
    authService.updateUserProfile(updatedUser);
    setSuccessMessage('Profile details saved successfully!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    authService.updateUserPassword(email, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMessage('Password changed successfully!');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCopySecretKey = () => {
    navigator.clipboard?.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard?.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([
      `ProphetVal 2FA Emergency Backup Codes for ${email}\n` +
      `Keep these in a safe place. Each code can be used once.\n\n` +
      backupCodes.join('\n')
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "prophetval-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOpen2FAModal = async () => {
    const key = user?.twoFactorSecret || totpService.generateSecret();
    setSecretKey(key);
    const targetEmail = email || user?.email || 'analyst@prophetval.ai';
    const uri = totpService.getOtpAuthUri(targetEmail, key);
    const qrData = await totpService.generateQRCodeDataUrl(uri);
    setQrCodeDataUrl(qrData);
    setTwoFactorStep(1);
    setTwoFactorCode('');
    setErrorMessage(null);
    setShow2FAModal(true);
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = twoFactorCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit authenticator verification code.');
      return;
    }

    setVerifying2FA(true);
    try {
      const isValid = await totpService.verifyCode(secretKey, cleanCode);
      if (!isValid) {
        setErrorMessage('Incorrect code. Please make sure your phone time is synchronized and enter the current 6-digit code from Google Authenticator.');
        setVerifying2FA(false);
        return;
      }

      setTwoFactorEnabled(true);
      const updated = {
        ...user,
        twoFactorEnabled: true,
        twoFactorSecret: secretKey
      };
      onUpdateUser(updated);
      authService.updateUserProfile(updated);
      setTwoFactorStep(2); // move to backup codes screen
      setTwoFactorCode('');
      setErrorMessage(null);
      setSuccessMessage('Two-Factor Authentication (TOTP) successfully activated!');
    } catch (err) {
      setErrorMessage(err.message || 'Error validating authenticator code.');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      setTwoFactorEnabled(false);
      const updated = { ...user, twoFactorEnabled: false };
      onUpdateUser(updated);
      authService.updateUserProfile(updated);
      setSuccessMessage('Two-Factor Authentication has been disabled.');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  return (
    <div className="profile-container">
      {/* Profile Header Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">
                {name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              className="avatar-change-badge"
              title="Change Avatar"
              onClick={() => {
                const samplePhotos = [
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                  ''
                ];
                const next = samplePhotos[(samplePhotos.indexOf(avatarUrl) + 1) % samplePhotos.length];
                setAvatarUrl(next);
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 className="profile-name">{name}</h1>
              {user?.provider === 'google' && (
                <span className="badge-provider google">
                  Google Account
                </span>
              )}
              {twoFactorEnabled && (
                <span className="badge-2fa-active">
                  <ShieldCheck size={14} /> 2FA Active
                </span>
              )}
            </div>
            <p className="profile-role">{role} • {organization}</p>
            <p className="profile-sub">{email} • {location}</p>
          </div>
        </div>

        <div className="profile-hero-right">
          <div className="profile-metric-pill">
            <Layers size={18} color="#3b82f6" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--heading-color)' }}>12</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Valuations Run</div>
            </div>
          </div>

          <div className="profile-metric-pill">
            <Calendar size={18} color="#10b981" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--heading-color)' }}>
                {user?.memberSince || 'Oct 2024'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Member Since</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="alert alert-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('general')}
        >
          <User size={18} />
          <span>Personal Information</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('security')}
        >
          <Shield size={18} />
          <span>Security & 2FA</span>
          {twoFactorEnabled && (
            <span className="tab-pill-dot" title="2FA Active"></span>
          )}
        </button>
      </div>

      {/* TAB 1: General Personal Info */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveProfile} className="card">
          <div className="card-title" style={{ marginBottom: '1.5rem' }}>
            <span>Personal & Operational Details</span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Professional Role / Title</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Senior Portfolio Analyst">Senior Portfolio Analyst</option>
                <option value="Real Estate Investor">Real Estate Investor</option>
                <option value="Residential Property Appraiser">Residential Property Appraiser</option>
                <option value="Mortgage Underwriter">Mortgage Underwriter</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Homeowner / Buyer">Homeowner / Buyer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Organization / Agency</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Location / Primary Market</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Professional Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & 2FA */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Two-Factor Authentication Status Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: twoFactorEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: twoFactorEnabled ? '#10b981' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                    Add an extra layer of security using Google Authenticator, Authy, or 1Password.
                  </p>
                </div>
              </div>

              <div>
                {twoFactorEnabled ? (
                  <span className="badge-status-on">
                    <ShieldCheck size={16} /> Enabled & Active
                  </span>
                ) : (
                  <span className="badge-status-off">
                    Disabled (Recommended)
                  </span>
                )}
              </div>
            </div>

            <div style={{ background: 'var(--chip-bg)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: 0 }}>
                {twoFactorEnabled
                  ? 'Your ProphetVal account requires a 6-digit TOTP verification code from your authenticator app each time you sign in.'
                  : 'Protect your valuations and property portfolios from unauthorized access by requiring a verification code at login.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {twoFactorEnabled ? (
                <>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowBackupCodesModal(true)}
                  >
                    View Backup Codes
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleDisable2FA}
                  >
                    Disable 2FA
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleOpen2FAModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ShieldCheck size={18} />
                  <span>Configure Two-Factor Authentication</span>
                </button>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <form onSubmit={handleUpdatePassword} className="card">
            <div className="card-title" style={{ marginBottom: '1.25rem' }}>
              <span>Change Account Password</span>
            </div>

            <div className="form-grid">
              <div className="form-group form-group-relative">
                <label>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input-with-both"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group form-group-relative">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-with-icon"
                    required
                  />
                </div>
              </div>

              <div className="form-group form-group-relative">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-with-icon"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn-secondary">
                Update Password
              </button>
            </div>
          </form>

          {/* Connected Accounts & Active Sessions */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1.25rem' }}>
              <span>Connected Authentication Providers</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--chip-bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--heading-color)', fontSize: '0.9rem' }}>Google Identity</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user?.provider === 'google' ? 'Connected as primary provider' : 'Available for one-click OAuth login'}
                    </div>
                  </div>
                </div>
                <span className="badge-provider google" style={{ fontSize: '0.75rem' }}>
                  {user?.provider === 'google' ? 'Connected' : 'Linked'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL */}
      {show2FAModal && (
        <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
          <div className="auth-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="#3b82f6" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                  {twoFactorStep === 1 ? 'Configure Authenticator App' : 'Save Emergency Backup Codes'}
                </h2>
              </div>
              <button
                onClick={() => setShow2FAModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {twoFactorStep === 1 ? (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Scan the QR code below using your mobile authenticator app (Google Authenticator, Authy, or Microsoft Authenticator).
                </p>

                {/* Real Scannable TOTP QR Code */}
                <div className="qr-box-container" style={{ textAlign: 'center' }}>
                  <div className="qr-box" style={{ background: '#ffffff', padding: '12px', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="TOTP Google Authenticator QR Code"
                        width="180"
                        height="180"
                        style={{ display: 'block', borderRadius: '4px' }}
                      />
                    ) : (
                      <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                        Generating QR Code...
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                      Can't scan? Use manual setup key in your app:
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecretKey}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Copy Secret Key"
                      >
                        {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirm2FA} style={{ marginTop: '1.25rem' }}>
                  <div className="form-group">
                    <label>Enter 6-Digit Authenticator Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 482910"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25em', fontFamily: 'var(--font-mono)' }}
                      required
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShow2FAModal(false)}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={verifying2FA}
                      style={{ flex: 2 }}
                    >
                      {verifying2FA ? 'Verifying TOTP...' : 'Verify & Activate 2FA'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--heading-color)', margin: '0 0 0.25rem' }}>
                    2FA Successfully Activated!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Save these emergency backup codes. If you ever lose your phone, each code can be used once to log in.
                  </p>
                </div>

                <div className="backup-codes-grid">
                  {backupCodes.map((c, i) => (
                    <div key={i} className="backup-code-item">
                      <code>{c}</code>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', margin: '1.25rem 0' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCopyBackupCodes}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {copiedCodes ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDownloadBackupCodes}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Download size={16} />
                    <span>Download TXT</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShow2FAModal(false)}
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  Done, I've Saved My Codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW BACKUP CODES MODAL */}
      {showBackupCodesModal && (
        <div className="modal-overlay" onClick={() => setShowBackupCodesModal(false)}>
          <div className="auth-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--heading-color)', margin: 0 }}>
                Emergency Backup Codes
              </h2>
              <button
                onClick={() => setShowBackupCodesModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Keep these safe. Each code can be entered during login if you don't have access to your authenticator app.
            </p>

            <div className="backup-codes-grid">
              {backupCodes.map((c, i) => (
                <div key={i} className="backup-code-item">
                  <code>{c}</code>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopyBackupCodes}
                style={{ flex: 1 }}
              >
                {copiedCodes ? 'Copied!' : 'Copy Codes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDownloadBackupCodes}
                style={{ flex: 1 }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

