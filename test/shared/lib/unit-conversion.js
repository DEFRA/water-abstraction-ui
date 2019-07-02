const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { convertToCubicMetres, convertToUserUnit, InvalidUnitError } = require('shared/lib/unit-conversion');

experiment('Test unit conversion helpers', () => {
  test('convertToCubicMetres should convert known units', async () => {
    expect(convertToCubicMetres(100, 'm³')).to.equal(100);
    expect(convertToCubicMetres(100, 'l')).to.equal(0.1);
    expect(convertToCubicMetres(100, 'Ml')).to.equal(100000);
    expect(convertToCubicMetres(100, 'gal')).to.equal(0.454609);
  });

  test('convertToCubicMetres should throw an error for unknown units', async () => {
    const func = () => {
      convertToCubicMetres(100, 'x');
    };
    expect(func).to.throw(InvalidUnitError, 'Unknown unit x');
  });

  test('convertToCubicMetres should return null if null value given', async () => {
    expect(convertToCubicMetres(null, 'm³')).to.equal(null);
    expect(convertToCubicMetres(null, 'l')).to.equal(null);
    expect(convertToCubicMetres(null, 'Ml')).to.equal(null);
    expect(convertToCubicMetres(null, 'gal')).to.equal(null);
  });

  test('convertToCubicMetres should return null if undefined value given', async () => {
    expect(convertToCubicMetres(undefined, 'm³')).to.equal(null);
    expect(convertToCubicMetres(undefined, 'l')).to.equal(null);
    expect(convertToCubicMetres(undefined, 'Ml')).to.equal(null);
    expect(convertToCubicMetres(undefined, 'gal')).to.equal(null);
  });

  test('convertToUserUnit should convert known units', async () => {
    expect(convertToUserUnit(100, 'm³')).to.equal(100);
    expect(convertToUserUnit(100, 'l')).to.equal(100000);
    expect(convertToUserUnit(100, 'Ml')).to.equal(0.1);
    expect(convertToUserUnit(100, 'gal')).to.equal(21996.924829900);
  });

  test('convertToUserUnit should throw an error for unknown units', async () => {
    const func = () => {
      convertToUserUnit(100, 'x');
    };
    expect(func).to.throw(InvalidUnitError, 'Unknown unit x');
  });

  test('convertToUserUnit should return null if null value given', async () => {
    expect(convertToUserUnit(null, 'm³')).to.equal(null);
    expect(convertToUserUnit(null, 'l')).to.equal(null);
    expect(convertToUserUnit(null, 'Ml')).to.equal(null);
    expect(convertToUserUnit(null, 'gal')).to.equal(null);
  });
});
