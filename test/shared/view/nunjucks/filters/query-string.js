'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  queryString
} = require('shared/view/nunjucks/filters/query-string');

experiment('queryString Nunjucks filter', () => {
  const obj = { foo: 'bar', bar: 'foo' };

  test('It should serialize an object into a query string', async () => {
    const result = queryString(obj);
    expect(result).to.equal('foo=bar&bar=foo');
  });
});
