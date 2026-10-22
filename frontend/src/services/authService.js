/**
 * Client authentication and user registry service.
 * Manages user accounts, credentials, 2FA states, and session persistence.
 */

const USERS_STORAGE_KEY = 'prophetval_users_db';
const CURRENT_USER_KEY = 'prophetval_user';

export const authService = {
  getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not read user database', e);
    }
    return [];
  },

  registerUser({ name, email, password, role, twoFactorEnabled = false, twoFactorSecret }) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const newUser = {
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: role || 'Real Estate Investor',
      organization: 'ProphetVal User',
      phone: '',
      location: '',
      bio: '',
      twoFactorEnabled: Boolean(twoFactorEnabled),
      twoFactorSecret: twoFactorSecret || 'JBSWY3DPEHPK3PXP',
      avatarInitial: name.trim().charAt(0).toUpperCase(),
      memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      token: 'pv_' + Math.random().toString(36).substring(2, 12),
      loginTime: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  loginUser({ email, password }) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('No account found with this email. Please register for an account first.');
    }

    if (user.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials or use Forgot Password.');
    }

    const sessionUser = {
      ...user,
      avatarInitial: user.avatarInitial || user.name.charAt(0).toUpperCase(),
      token: 'pv_' + Math.random().toString(36).substring(2, 12),
      loginTime: new Date().toISOString()
    };

    return sessionUser;
  },

  findUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  updateUserPassword(email, newPassword) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (index !== -1) {
      users[index].password = newPassword;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: users[index], isNew: false };
    } else {
      // Create user record with new password if not existing
      const newUser = {
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: newPassword,
        role: 'Real Estate Analyst',
        organization: 'ProphetVal User',
        phone: '',
        location: '',
        bio: '',
        twoFactorEnabled: false,
        avatarInitial: cleanEmail.charAt(0).toUpperCase(),
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        token: 'pv_' + Math.random().toString(36).substring(2, 12),
        loginTime: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: newUser, isNew: true };
    }
  },

  updateUserProfile(updatedUser) {
    const users = this.getUsers();
    const cleanEmail = updatedUser.email.trim().toLowerCase();
    const index = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }
};
