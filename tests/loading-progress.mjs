import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

let now = 0, nextId = 0;
const intervals = new Map(), timeouts = new Map();
const scope = vm.createContext({
  Date: { now: () => now },
  setInterval: fn => { intervals.set(++nextId, fn); return nextId; },
  clearInterval: id => intervals.delete(id),
  setTimeout: fn => { timeouts.set(++nextId, fn); return nextId; },
  clearTimeout: id => timeouts.delete(id)
});
vm.runInContext(fs.readFileSync('js/loading.js', 'utf8').replaceAll('export ', '') + '\nglobalThis.manager = new LoadingManager();', scope);
const m = scope.manager;
function tick(count) { for (let i = 0; i < count; i++) { now += 500; [...intervals.values()].forEach(fn => fn()); } }
m.start('page'); m.start('first request'); m.start('second request');
tick(14);
assert.equal(m.isShowing, true, 'pending work remains visible beyond the old 5.5 second watchdog');
assert.ok(m.progress > 5 && m.progress < 100);
m.done('first');
assert.equal(m.activeCount, 2);
assert.ok(m.progress < 100, 'one finished request cannot claim all work is complete');
m.set(98); tick(2);
assert.equal(m.progress, 98, 'estimate never decreases at a later stage');
m.done('second'); m.done('page ready');
assert.equal(m.progress, 100);
assert.equal(intervals.size, 0);
m.start('new action before the previous badge hides');
assert.equal(timeouts.size, 0, 'starting new work cancels the previous hide callback');
tick(200);
assert.ok(m.progress <= 95 && m.isShowing);
m.start('parallel action');
m.fail('connection failed');
assert.equal(m.activeCount, 1);
m.done('other action done');
assert.equal(m.failure, 'connection failed');
assert.ok(m.progress < 100, 'failure never displays 100 percent success');
assert.equal(intervals.size, 0);
console.log('Loading progress tests passed: long waits, concurrent requests, monotonic estimates, restart race and failures.');
