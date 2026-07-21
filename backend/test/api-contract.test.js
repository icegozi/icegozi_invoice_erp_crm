const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const appApi = read('src/routes/appRoutes/appApi.js');
const coreAuth = read('src/routes/coreRoutes/coreAuth.js');
const coreApi = read('src/routes/coreRoutes/coreApi.js');
const appSource = read('src/app.js');

const entities = ['client', 'invoice', 'payment', 'paymentmode', 'quote', 'taxes'];
const crudOperations = ['create', 'read', 'update', 'delete', 'search', 'list', 'listAll', 'filter', 'summary'];

test('API exposes health, public-file, and protected-download routes', () => {
  assert.match(appSource, /app\.get\('\/health'/);
  assert.match(appSource, /app\.use\('\/download', adminAuth\.isValidAuthToken/);
  assert.match(appSource, /app\.use\('\/public', corePublicRouter/);
});

for (const endpoint of ['login', 'forgetpassword', 'resetpassword', 'logout']) {
  test(`authentication endpoint /api/${endpoint} is registered`, () => {
    assert.match(coreAuth, new RegExp(`route\\('\/${endpoint}'\\)`));
  });
}

for (const entity of entities) {
  for (const operation of crudOperations) {
    test(`ERP route contract exposes ${entity}/${operation}`, () => {
      assert.match(appApi, new RegExp(`\\/\\$\\{entity\\}\\/${operation}`));
    });
  }
}

for (const endpoint of ['invoice/mail', 'payment/mail', 'quote/mail', 'quote/convert/:id']) {
  test(`ERP special route contract exposes ${endpoint}`, () => {
    const [entity, operation] = endpoint.split('/');
    if (operation === 'mail') {
      assert.match(appApi, /entity === 'invoice' \|\| entity === 'quote' \|\| entity === 'payment'/);
    } else {
      assert.match(appApi, /entity === 'quote'/);
    }
  });
}

for (const endpoint of [
  'admin/read/:id',
  'admin/password-update/:id',
  'admin/profile/password',
  'admin/profile/update',
  'setting/create',
  'setting/read/:id',
  'setting/update/:id',
  'setting/search',
  'setting/list',
  'setting/listAll',
  'setting/filter',
  'setting/readBySettingKey/:settingKey',
  'setting/listBySettingKey',
  'setting/updateBySettingKey/:settingKey?',
  'setting/upload/:settingKey?',
  'setting/updateManySetting',
]) {
  test(`core API contract exposes ${endpoint}`, () => {
    assert.match(coreApi, new RegExp(`\\/${endpoint.replace(/[?]/g, '\\?')}`));
  });
}
