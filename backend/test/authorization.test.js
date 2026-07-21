const test = require('node:test');
const assert = require('node:assert/strict');
const { authorize, hasAtLeastRole } = require('../src/middlewares/authorize');

const invoke = (middleware, admin) => {
  let status;
  let payload;
  let nextCalled = false;
  middleware(
    { admin },
    { status(code) { status = code; return this; }, json(body) { payload = body; } },
    () => { nextCalled = true; }
  );
  return { status, payload, nextCalled };
};

test('authorize permits only explicitly allowed roles', () => {
  assert.equal(invoke(authorize('owner', 'admin'), { role: 'owner' }).nextCalled, true);
  const denied = invoke(authorize('owner', 'admin'), { role: 'sales' });
  assert.equal(denied.status, 403);
  assert.equal(denied.payload.success, false);
});

test('hasAtLeastRole enforces the ERP write-role hierarchy', () => {
  assert.equal(invoke(hasAtLeastRole('sales'), { role: 'sales' }).nextCalled, true);
  assert.equal(invoke(hasAtLeastRole('accountant'), { role: 'admin' }).nextCalled, true);
  assert.equal(invoke(hasAtLeastRole('admin'), { role: 'accountant' }).status, 403);
  assert.equal(invoke(hasAtLeastRole('sales'), undefined).status, 403);
});
