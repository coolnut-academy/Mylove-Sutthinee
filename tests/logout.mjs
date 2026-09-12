import assert from 'node:assert/strict';
const storage = new Map();
const listeners = {};
globalThis.window = {
  location: { search: '' },
  addEventListener(name, fn) { listeners[name] = fn; },
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  }
};
const { AppState } = await import('../js/app-state.js');
const { AuthApi, provider } = await import('../js/api.js');
provider.logout = () => { throw new Error('Logout must not call Google'); };
globalThis.fetch = () => { throw new Error('Logout must not fetch'); };
let changes = 0;
AppState.on('authChanged', () => changes++);
AppState.setSession({ token: 'test-only' });
assert.equal(AppState.isAdmin(), true);
const before = changes;
assert.equal(AuthApi.logout().loggedOut, true);
assert.equal(AppState.isAdmin(), false);
assert.equal(storage.has('stw:admin_session'), false);
assert.equal(changes, before + 1);
AppState.setSession({ token: 'another-tab' });
storage.delete('stw:admin_session');
listeners.storage({ key: 'stw:admin_session' });
assert.equal(AppState.isAdmin(), false, 'logout in another tab clears this tab');
AppState.setSession({ token: 'blocked-storage' });
window.localStorage.removeItem = () => { throw new Error('Storage blocked'); };
const warn = console.warn;
console.warn = () => {};
try { AuthApi.logout(); } finally { console.warn = warn; }
assert.equal(AppState.isAdmin(), false, 'storage errors must not preserve in-memory admin access');
console.log('Logout passed: immediate state reset, no network, storage removal, cross-tab logout, blocked storage.');
