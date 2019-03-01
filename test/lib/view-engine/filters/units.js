'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const { expect } = require('code');

const {
  units
} = require('../../../../src/lib/view-engine/filters/units.js');

lab.experiment('units Nunjucks filter', () => {
  lab.test('converts m³ to Cubic metres', async () => {
    expect(units('m³')).to.equal('Cubic metres');
  });

  lab.test('converts gal to Gallons', async () => {
    expect(units('gal')).to.equal('Gallons');
  });

  lab.test('converts l (lowercase L) to Litres', async () => {
    expect(units('l')).to.equal('Litres');
  });
  lab.test('converts Ml to Megalitres', async () => {
    expect(units('Ml')).to.equal('Megalitres');
  });
  lab.test('returns undefined for unknown units', async () => {
    expect(units('bucket')).to.equal(undefined);
  });
});
