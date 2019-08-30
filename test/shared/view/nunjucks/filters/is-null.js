'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  isNull
} = require('shared/view/nunjucks/filters/is-null');

experiment('isNull Nunjucks filter', () => {
  test('it should return true if value is null', async () => {
    expect(isNull(null)).to.be.true();
  });

  const values = [false, 'String', 12, ['x', 'y'], { foo: 'bar' }, NaN, undefined];

  values.forEach(value => {
    test(`it should return false for ${value}`, async () => {
      expect(isNull(value)).to.be.false();
    });
  });
});
