'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  queryString
} = require('../../../../../src/internal/lib/view-engine/filters/query-string');

lab.experiment('queryString Nunjucks filter', () => {
  const obj = { foo: 'bar', bar: 'foo' };

  lab.test('It should serialize an object into a query string', async () => {
    const result = queryString(obj);
    expect(result).to.equal('foo=bar&bar=foo');
  });
});
