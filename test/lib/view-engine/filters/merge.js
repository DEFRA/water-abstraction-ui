'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  merge
} = require('../../../../src/lib/view-engine/filters/merge.js');

lab.experiment('merge Nunjucks filter', () => {
  const obj1 = { foo: 'bar' };
  const obj2 = { bar: 'foo' };

  lab.test('It should merge the properties of 2 objects', async () => {
    const result = merge(obj1, obj2);
    expect(result).to.equal({ ...obj1, ...obj2 });
  });
});
