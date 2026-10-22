import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail } from 'firebase/auth';

const FIREBASE_CONFIG_STORAGE_KEY = 'prophetval_firebase_config';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "house-price-prediction-s-17743.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "house-price-prediction-s-17743",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "house-price-prediction-s-17743.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "12991141666",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:12991141666:web:770a1500a13af53debf77b"
};

/**
 * Retrieve current Firebase configuration from either localStorage or Vite environment variables.
 */
export function getFirebaseConfig() {
  try {
    const local = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.apiKey && parsed.apiKey.length > 10) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local Firebase config', e);
  }

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envKey && envKey.length > 10) {
    return {
      apiKey: envKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Check if a valid Firebase API Key and Auth Domain are present.
 */
export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.apiKey.length > 10 &&
    config.authDomain &&
    !config.apiKey.includes('your_')
  );
}

/**
 * Save Firebase configuration to localStorage so users can connect without editing files.
 */
export function saveFirebaseConfig(config) {
  localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
  // If apps exist, we reload to re-initialize with new credentials
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Initialize or get Firebase Auth instance.
 */
let authInstance = null;
export function getFirebaseAuth() {
  if (authInstance) return authInstance;

  const config = getFirebaseConfig();
  if (!config.apiKey) return null;

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    authInstance = getAuth(app);
    return authInstance;
  } catch (err) {
    console.warn('Failed to initialize Firebase app', err);
    return null;
  }
}

/**
 * Real-time Google Authentication via Firebase signInWithPopup.
 * Opens the authentic Google OAuth popup to sign in with your own Gmail account.
 */
export async function signInWithGoogleRealtime() {
  if (!isFirebaseConfigured()) {
    throw new Error('CONFIG_REQUIRED');
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Unable to initialize Firebase Authentication. Please check your credentials.');
  }

  const provider = new GoogleAuthProvider();
  // Force account picker so user can select their personal or work Gmail
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;

    const formattedUser = {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      avatarUrl: user.photoURL || '',
      avatarInitial: (user.displayName || user.email).charAt(0).toUpperCase(),
      role: 'Real Estate Analyst',
      provider: 'google',
      googleUid: user.uid,
      twoFactorEnabled: false,
      token: credential?.accessToken || `fb_${user.uid}`,
      emailVerified: user.emailVerified,
      loginTime: new Date().toISOString(),
      memberSince: user.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Oct 2024'
    };

    return formattedUser;
  } catch (error) {
    if (error.code === 'auth/configuration-not-found') {
      throw new Error(
        `Firebase Setup Required: Google Sign-in provider has not been enabled in your Firebase project yet.\n\n` +
        `How to fix:\n` +
        `1. Open: https://console.firebase.google.com/project/house-price-prediction-s-17743/authentication/providers\n` +
        `2. Click on 'Google' under Sign-in providers.\n` +
        `3. Toggle the switch to 'Enable'.\n` +
        `4. Select your Gmail in 'Project support email' and click 'Save'.`
      );
    }
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. The Google sign-in popup was closed before completing.');
    }
    if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Authentication request was cancelled.');
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(
        `Firebase Error: The current domain (${window.location.hostname}) is not authorized in your Firebase Console. Go to Firebase Console -> Authentication -> Settings -> Authorized domains, and add '${window.location.hostname}'.`
      );
    }
    throw new Error(error.message || 'Failed to authenticate with Google Firebase.');
  }
}

/**
 * Sign out from Firebase Auth.
 */
export async function signOutFromFirebase() {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Error signing out from Firebase', e);
    }
  }
}

/**
 * Send authentic password reset email via Firebase Authentication.
 */
export async function sendFirebasePasswordReset(email) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Authentication is not configured yet.');
  }

  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Unable to initialize Firebase Authentication.');
  }

  try {
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error(`No Firebase account registered with "${email}". If you registered an in-app account, use the security verification code option below.`);
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (error.code === 'auth/configuration-not-found') {
      throw new Error('Firebase Authentication email provider is not enabled in your Firebase console.');
    }
    throw new Error(error.message || 'Failed to dispatch password reset email.');
  }
}

