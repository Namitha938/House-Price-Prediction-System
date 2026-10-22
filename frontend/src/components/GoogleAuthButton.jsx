import React, { useState } from 'react';
import { Sparkles, X, ExternalLink, Key, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import {
  signInWithGoogleRealtime,
  isFirebaseConfigured,
  getFirebaseConfig,
  saveFirebaseConfig
} from '../services/firebase';

export default function GoogleAuthButton({ onGoogleSuccess, text = "Continue with Google", isSignUp = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Firebase Config Form State
  const initialConfig = getFirebaseConfig();
  const [apiKey, setApiKey] = useState(initialConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(initialConfig.authDomain || '');
  const [projectId, setProjectId] = useState(initialConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(initialConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(initialConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(initialConfig.appId || '');

  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!isFirebaseConfigured()) {
        setShowConfigModal(true);
        setLoading(false);
        return;
      }

      // Triggers real-time Google OAuth popup via Firebase Auth
      const realUser = await signInWithGoogleRealtime();
      onGoogleSuccess(realUser);
    } catch (err) {
      if (err.message === 'CONFIG_REQUIRED') {
        setShowConfigModal(true);
      } else {
        setError(err.message || 'Google sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!apiKey || !authDomain || !projectId) {
      alert('Please fill in at least the API Key, Auth Domain, and Project ID from your Firebase Console.');
      return;
    }

    const newConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfig(newConfig);
  };

  return (
    <>
      <button
        type="button"
        className="btn-google-auth"
        onClick={handleGoogleClick}
        disabled={loading}
      >
        {loading ? (
          <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></div>
        ) : (
          /* Official Google 'G' 4-Color SVG Logo */
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? "Connecting to Google..." : text}</span>
      </button>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem', fontSize: '0.825rem', whiteSpace: 'pre-line', textAlign: 'left', lineHeight: '1.5' }}>
          <span>{error}</span>
        </div>
      )}

      {/* FIREBASE CONFIGURATION SETUP MODAL */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="google-picker-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="google-picker-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Key size={22} color="#f59e0b" />
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--heading-color)' }}>
                  Connect Your Firebase Project
                </span>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 0.75rem' }}>
                To sign in with your real Gmail account in real-time, link your free Firebase project credentials:
              </p>
              <ol style={{ fontSize: '0.825rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Firebase Console <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
                <li>Under <strong>Build &gt; Authentication &gt; Sign-in method</strong>, enable <strong>Google</strong>.</li>
                <li>Under <strong>Project settings &gt; General &gt; Your apps</strong>, copy your web configuration.</li>
              </ol>
            </div>

            <form onSubmit={handleSaveConfig} style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>apiKey *</label>
                  <input
                    type="text"
                    placeholder="Enter Firebase API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>authDomain *</label>
                  <input
                    type="text"
                    placeholder="my-project.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>projectId *</label>
                  <input
                    type="text"
                    placeholder="my-project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>appId</label>
                  <input
                    type="text"
                    placeholder="1:123456789:web:abcdef..."
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Stored safely in your browser or <code>frontend/.env</code>
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowConfigModal(false)}
                    style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    Save & Enable Real-Time Gmail
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
