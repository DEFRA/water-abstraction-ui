'use strict';

const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const {
  unitConversion
} = require('shared/view/nunjucks/filters/unit-conversion');

experiment('Test unit conversion helpers', () => {
  test('unitConversion should convert known units', async () => {
    expect(unitConversion(100, 'm³')).to.equal(100);
    expect(unitConversion(100, 'l')).to.equal(0.1);
    expect(unitConversion(100, 'Ml')).to.equal(100000);
    expect(unitConversion(100, 'gal')).to.equal(0.454609);
  });

  test('unitConversion should return null if null value given', async () => {
    expect(unitConversion(null, 'm³')).to.equal(null);
    expect(unitConversion(null, 'l')).to.equal(null);
    expect(unitConversion(null, 'Ml')).to.equal(null);
    expect(unitConversion(null, 'gal')).to.equal(null);
  });

  test('unitConversion should return null if undefined value given', async () => {
    expect(unitConversion(undefined, 'm³')).to.equal(null);
    expect(unitConversion(undefined, 'l')).to.equal(null);
    expect(unitConversion(undefined, 'Ml')).to.equal(null);
    expect(unitConversion(undefined, 'gal')).to.equal(null);
  });
});
