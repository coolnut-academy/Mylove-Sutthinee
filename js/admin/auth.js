/**
 * Admin Authentication Controller
 * Suttinee Teacher Workspace
 */

import { AppState } from '../app-state.js';
import { AuthApi } from '../api.js';
import { Toast } from '../toast.js';

export class AdminAuthController {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.loginView = document.getElementById('admin-login-view');
    this.shellView = document.getElementById('admin-shell');
    this.loginForm = document.getElementById('admin-login-form');
    this.logoutBtn = document.getElementById('btn-logout');
    this.init();
  }

  init() {
    this._bindEvents();
    this.checkSession();
  }

  _bindEvents() {
    this.loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwdInput = document.getElementById('admin-password');
      const password = pwdInput ? pwdInput.value.trim() : '';

      if (!password) return;

      try {
        const res = await AuthApi.login(password);
        if (res.success && res.session) {
          AppState.setSession(res.session);
          Toast.success('เข้าสู่ระบบผู้ดูแลเรียบร้อยแล้ว');
          this._showShell();
          if (this.onAuthSuccess) this.onAuthSuccess();
        }
      } catch (err) {
        Toast.error(err.message || 'รหัสผ่านไม่ถูกต้อง');
      }
    });

    this.logoutBtn?.addEventListener('click', async () => {
      try {
        await AuthApi.logout();
      } catch (e) {
        console.warn(e);
      }
      AppState.setSession(null);
      Toast.info('ออกจากระบบเรียบร้อยแล้ว');
      this._showLogin();
    });
  }

  checkSession() {
    if (AppState.isAdmin()) {
      this._showShell();
      if (this.onAuthSuccess) this.onAuthSuccess();
    } else {
      this._showLogin();
    }
  }

  _showLogin() {
    if (this.loginView) this.loginView.classList.remove('d-none');
    if (this.shellView) this.shellView.classList.add('d-none');
  }

  _showShell() {
    if (this.loginView) this.loginView.classList.add('d-none');
    if (this.shellView) this.shellView.classList.remove('d-none');
  }
}
