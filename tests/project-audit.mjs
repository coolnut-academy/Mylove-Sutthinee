import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { Cache } from '../js/cache.js';
import { PaRepository } from '../js/data/repositories.js';

// Parse every backend file; report missing API methods used by any frontend module.
for (const name of fs.readdirSync('apps-script').filter(n => n.endsWith('.gs'))) new vm.Script(fs.readFileSync('apps-script/' + name, 'utf8'), { filename: name });
const apis = await import('../js/api.js');
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = dir + '/' + entry.name;
    if (entry.isDirectory()) scan(file);
    else if (file.endsWith('.js')) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/\b(SettingsApi|YearsApi|PaApi|ClassroomApi|AuthApi|FileApi)\.(\w+)\s*\(/g)) {
        assert.equal(typeof apis[match[1]][match[2]], 'function', file + ': missing ' + match[0]);
      }
    }
  }
}
scan('js');
let finish;
const records = new Map();
Cache.get = key => records.get(key) || null;
Cache.set = (key, value) => records.set(key, value);
const pending = Cache.swr('settings', () => new Promise(resolve => { finish = resolve; }));
Cache.invalidate('settings');
finish({ title: 'old' }); await pending;
assert.equal(records.has('settings'), false, 'old read cannot recreate cache invalidated by a save');

const payload = { year: '2567', title: 'Updated', description: 'Description' };
const repo = new PaRepository({ updatePaSection: async input => ({ ...input, _persisted: true }) });
assert.equal((await repo.updateSection('1.1', payload)).title, 'Updated');
repo.provider.updatePaSection = async input => ({ ...input, year: '2568', _persisted: true });
await assert.rejects(repo.updateSection('1.1', payload));

const props = new Map([['ADMIN_PASSWORD_HASH', crypto.createHash('sha256').update('own-password' + 'salt').digest('hex')], ['ADMIN_PASSWORD_SALT', 'salt']]);
const authContext = vm.createContext({ Date, PropertiesService: { getScriptProperties: () => ({ getProperty: k => props.get(k), setProperty: (k,v) => props.set(k,v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Utilities: { getUuid: () => crypto.randomUUID(), base64Encode: value => Buffer.from(value).toString('base64'), base64Decode: value => Buffer.from(value, 'base64'), newBlob: value => ({ getDataAsString: () => value.toString() }) },
  Utils: { hashPassword: (value, salt) => crypto.createHash('sha256').update(value + salt).digest('hex') }
});
vm.runInContext(fs.readFileSync('apps-script/Config.gs', 'utf8') + fs.readFileSync('apps-script/Auth.gs', 'utf8') + '\nglobalThis.Auth=Auth;globalThis.Config=CONFIG;', authContext);
for (const bad of ['New1234', 'admin123', props.get('ADMIN_PASSWORD_HASH')]) assert.throws(() => authContext.Auth.login(bad));
const session = authContext.Auth.login('own-password');
assert.equal(authContext.Auth.validateToken(session.token), true);
const secret = props.get('SESSION_SECRET');
assert.ok(secret && secret.length > 60);
assert.equal(authContext.Config.getSessionSecret(), secret, 'generated secret persists');
console.log('Project audit passed: backend syntax, all frontend API methods, stale-cache invalidation, verified section save, configured-password bypass rejection, persistent session signing secret.');
