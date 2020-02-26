'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { charge } = require('shared/view/nunjucks/filters/charge');

experiment('charge Nunjucks filter', () => {
  test('Accepts a charge as an integer in pence and formats to pounds and pence', async () => {
    expect(charge(356275)).to.equal('£3,562.75');
  });

  test('Formats 0 correctly', async () => {
    expect(charge(0)).to.equal('£0.00');
  });

  test('Removes the sign from negative charges', async () => {
    expect(charge(-353)).to.equal('£3.53');
  });

  test('When the charge is undefined, return undefined', async () => {
    expect(charge(undefined)).to.equal(undefined);
  });

  test('When the charge is null, return undefined', async () => {
    expect(charge(null)).to.equal(undefined);
  });
});
