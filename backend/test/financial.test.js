const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../src/helpers');
const { ROLE_RANK } = require('../src/middlewares/authorize');

test('financial calculations retain decimal precision', () => {
  const subTotal = calculate.add(calculate.multiply(19.99, 3), calculate.multiply(10.01, 2));
  const tax = calculate.multiply(subTotal, 0.1);
  assert.equal(subTotal, 79.99);
  assert.equal(tax, 8);
  assert.equal(calculate.sub(calculate.add(subTotal, tax), 87.99), 0);
});

test('remaining invoice balance subtracts discount and recorded payments', () => {
  const total = 1000;
  const discount = 100;
  const paid = 300;

  assert.equal(calculate.sub(calculate.sub(total, discount), paid), 600);
});

test('role ordering keeps accounting and administration above sales', () => {
  assert.ok(ROLE_RANK.owner > ROLE_RANK.admin);
  assert.ok(ROLE_RANK.admin > ROLE_RANK.accountant);
  assert.ok(ROLE_RANK.accountant > ROLE_RANK.sales);
  assert.ok(ROLE_RANK.sales > ROLE_RANK.viewer);
});
