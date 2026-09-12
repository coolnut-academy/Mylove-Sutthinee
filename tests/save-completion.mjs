import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { AppsScriptDataProvider } from '../js/data/apps-script-provider.js';
import { Loading } from '../js/loading.js';

for (const name of ['start', 'done', 'fail', 'setMessage']) Loading[name] = () => {};
const oldFetch = globalThis.fetch;
const oldError = console.error;
console.error = () => {};
try {
  // Headers arrive immediately, but the body never finishes. The deadline must
  // still abort body consumption and release the saving UI.
  globalThis.fetch = async (url, { signal }) => ({
    text: () => new Promise((resolve, reject) => signal.addEventListener('abort',
      () => reject(new DOMException('Aborted', 'AbortError')), { once: true }))
  });
  const provider = new AppsScriptDataProvider('https://example.org/exec');
  let deadline;
  try {
    await assert.rejects(Promise.race([
      provider._request('saveClassroomDocument', {}, { method: 'POST', timeoutMs: 25 }),
      new Promise((resolve, reject) => { deadline = setTimeout(() => reject(Error('Body deadline did not fire')), 1000); })
    ]), /หมดเวลา/);
  } finally { clearTimeout(deadline); }
} finally { globalThis.fetch = oldFetch; console.error = oldError; }

for (const [file, name, apiName, loadMethod, dataProp] of [
  ['classroom', 'ClassroomPageController', 'ClassroomApi', '_loadClassroomData', 'classroomData'],
  ['pa', 'PaPageController', 'PaApi', '_loadPaData', 'paItems']
]) {
  let finishRead;
  const pending = new Promise(resolve => { finishRead = resolve; });
  const scope = vm.createContext({ document: { addEventListener() {} }, console,
    [apiName]: { getClassroomData: () => pending, getPaData: () => pending }
  });
  const source = fs.readFileSync(`js/pages/${file}.js`, 'utf8').replace(/^import .*;\r?$/gm, '');
  vm.runInContext(source + `\nglobalThis.Controller = ${name};`, scope);
  const page = Object.create(scope.Controller.prototype);
  page.currentYear = '2567'; page._renderCurrentView = () => {};
  const loading = page[loadMethod]('2567');
  const saved = { id: 'saved', year: '2567', title: 'Saved member', _persisted: true };
  page._showSavedItem(saved);
  finishRead(file === 'classroom' ? { documents: [] } : { sections: [], items: [] });
  await loading;
  const items = file === 'classroom' ? page[dataProp].documents : page[dataProp];
  assert.equal(items[0].id, 'saved', 'an older pending GET cannot erase a confirmed save');
}
console.log('Save completion tests passed: stalled response body aborts; confirmed card renders immediately and survives stale in-flight reads.');
