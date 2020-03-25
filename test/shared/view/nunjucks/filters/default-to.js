'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { defaultTo } = require('shared/view/nunjucks/filters/default-to');

experiment('shared/view/nunjucks/filters/default-to', () => {
  test('returns the value if the value is zero', async () => {
    expect(defaultTo(0, '-')).to.equal(0);
  });

  test('returns the value if the value is an empty string', async () => {
    expect(defaultTo('', '-')).to.equal('');
  });

  test('returns the default if the value is null', async () => {
    expect(defaultTo(null, '-')).to.equal('-');
  });

  test('returns the default if the value is undefined', async () => {
    expect(defaultTo(undefined, '-')).to.equal('-');
  });
});
