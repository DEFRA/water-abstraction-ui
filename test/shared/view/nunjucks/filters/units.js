'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  units
} = require('shared/view/nunjucks/filters/units');

experiment('units Nunjucks filter', () => {
  test('converts m³ to Cubic metres', async () => {
    expect(units('m³')).to.equal('Cubic metres');
  });

  test('converts gal to Gallons', async () => {
    expect(units('gal')).to.equal('Gallons');
  });

  test('converts l (lowercase L) to Litres', async () => {
    expect(units('l')).to.equal('Litres');
  });
  test('converts Ml to Megalitres', async () => {
    expect(units('Ml')).to.equal('Megalitres');
  });
  test('returns undefined for unknown units', async () => {
    expect(units('bucket')).to.equal(undefined);
  });
});
