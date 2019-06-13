'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const {
  queryString
} = require('../../../../../src/shared/view/nunjucks/filters/query-string');

experiment('queryString Nunjucks filter', () => {
  const obj = { foo: 'bar', bar: 'foo' };

  test('It should serialize an object into a query string', async () => {
    const result = queryString(obj);
    expect(result).to.equal('foo=bar&bar=foo');
  });
});
