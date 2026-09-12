/**
 * Global Reactive App State
 * Suttinee Teacher Workspace
 */

import { CONFIG } from './config.js';
import { RouterUtils } from './router-utils.js';

class AppStateManager {
  constructor() {
    this._listeners = new Map();
    this.currentYear = RouterUtils.resolveYear();
    this.settings = null;
    this.session = null;
    this._loadSession();
  }

  /**
   * Subscribe to state event: 'yearChanged', 'settingsChanged', 'authChanged'
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(cb => {
        try { cb(data); } catch (err) { console.error(`Error in event listener ${event}:`, err); }
      });
    }
  }

  setYear(year) {
    if (!year || this.currentYear === String(year)) return;
    this.currentYear = String(year);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('stw:selected_year', this.currentYear);
    }
    RouterUtils.setQueryParam('year', this.currentYear);
    this.emit('yearChanged', this.currentYear);
  }

  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this.emit('settingsChanged', this.settings);
  }

  _loadSession() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('stw:admin_session');
        if (raw) {
          const session = JSON.parse(raw);
          // Check expiration if any
          if (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now()) {
            this.session = session;
          } else {
            window.localStorage.removeItem('stw:admin_session');
          }
        }
      } catch {
        this.session = null;
      }
    }
  }

  setSession(session) {
    this.session = session;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (session) {
        window.localStorage.setItem('stw:admin_session', JSON.stringify(session));
      } else {
        window.localStorage.removeItem('stw:admin_session');
      }
    }
    this.emit('authChanged', this.session);
  }

  isAdmin() {
    return Boolean(this.session && this.session.token);
  }
}

export const AppState = new AppStateManager();
