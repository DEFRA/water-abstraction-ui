'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { merge } = require('shared/view/nunjucks/filters/merge');

experiment('merge Nunjucks filter', () => {
  const obj1 = { foo: 'bar' };
  const obj2 = { bar: 'foo' };

  test('It should merge the properties of 2 objects', async () => {
    const result = merge(obj1, obj2);
    expect(result).to.equal({ ...obj1, ...obj2 });
  });
});
