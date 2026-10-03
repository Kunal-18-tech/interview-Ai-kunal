/**
 * InterviewIQ AI — LocalStorage & State Management Module
 * Manages user profile, API keys, interview history, and resume storage.
 */

const STORAGE_KEYS = {
  PROFILE: 'interviewiq_user_profile',
  API_KEY: 'interviewiq_api_key',
  HISTORY: 'interviewiq_interview_history',
  SETTINGS: 'interviewiq_settings',
  LAST_MATCH: 'interviewiq_last_jd_match'
};

export const StorageManager = {
  // --- Profile ---
  getProfile() {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      return {
        name: 'Alex Johnson',
        role: 'Full Stack Developer',
        avatarText: 'AJ'
      };
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { name: 'Alex Johnson', role: 'Full Stack Developer', avatarText: 'AJ' };
    }
  },

  saveProfile(profile) {
    const initials = profile.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'IQ';
    
    const updated = {
      name: profile.name || 'Candidate',
      role: profile.role || 'Software Engineer',
      avatarText: initials
    };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  },

  // --- API Key ---
  getApiKey() {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  saveApiKey(key) {
    if (key) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  },

  // --- Interview History ---
  getHistory() {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  },

  saveSession(sessionData) {
    const history = this.getHistory();
    const newSession = {
      id: 'session_' + Date.now(),
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      config: sessionData.config,
      scorecard: sessionData.scorecard,
      questions: sessionData.questions,
      answers: sessionData.answers
    };

    history.unshift(newSession); // Add to start
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50))); // Keep last 50
    return newSession;
  },

  getStats() {
    const history = this.getHistory();
    if (history.length === 0) {
      return {
        completedCount: 0,
        avgScore: 0,
        topMetric: 'Technical Knowledge',
        streakDays: 1
      };
    }

    const totalScore = history.reduce((acc, curr) => acc + (curr.scorecard?.overallScore || 0), 0);
    const avgScore = Math.round(totalScore / history.length);

    return {
      completedCount: history.length,
      avgScore: avgScore,
      topMetric: 'Problem Solving',
      streakDays: Math.min(history.length, 7)
    };
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  },

  // -------------------------------------------------------------------------
  // Multi-User Auth System
  // -------------------------------------------------------------------------
  _getUsersDb() {
    try {
      return JSON.parse(localStorage.getItem('interviewiq_users_db') || '{}');
    } catch (e) {
      return {};
    }
  },

  _saveUsersDb(db) {
    localStorage.setItem('interviewiq_users_db', JSON.stringify(db));
  },

  /** Register a new user. Returns { success, error } */
  register(name, email, password, role) {
    const db = this._getUsersDb();
    const key = email.trim().toLowerCase();

    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (db[key]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'IQ';

    db[key] = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: key,
      password: btoa(password),
      role: role || 'Software Engineer',
      avatarText: initials,
      joinedDate: new Date().toISOString(),
      history: [],
      apiKey: ''
    };

    this._saveUsersDb(db);
    return { success: true };
  },

  /** Login an existing user. Returns { success, user, error } */
  login(email, password) {
    const db = this._getUsersDb();
    const key = email.trim().toLowerCase();
    const user = db[key];

    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (atob(user.password) !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const session = { email: key, name: user.name, avatarText: user.avatarText, role: user.role };
    sessionStorage.setItem('interviewiq_session', JSON.stringify(session));

    // Sync this user's data into localStorage so main app works unchanged
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify({
      name: user.name,
      role: user.role,
      avatarText: user.avatarText
    }));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(user.history || []));
    if (user.apiKey) localStorage.setItem(STORAGE_KEYS.API_KEY, user.apiKey);

    return { success: true, user: session };
  },

  /** Returns current logged-in session or null */
  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem('interviewiq_session') || 'null');
    } catch (e) {
      return null;
    }
  },

  /** Flush any local changes back to user record before logout */
  syncUserData() {
    const session = this.getSession();
    if (!session) return;
    const db = this._getUsersDb();
    const user = db[session.email];
    if (!user) return;

    const profile = this.getProfile();
    user.name = profile.name;
    user.role = profile.role;
    user.avatarText = profile.avatarText;
    user.history = this.getHistory();
    user.apiKey = this.getApiKey();

    this._saveUsersDb(db);
  },

  /** Logout current user */
  logout() {
    this.syncUserData();
    sessionStorage.removeItem('interviewiq_session');
  }
};
