const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { splitString } = require('../../../src/external/lib/string-formatter');

experiment('splitString', () => {
  test('splits string by commas and return first element by default', async () => {
    expect(splitString('some,string,here')).to.equal('some');
  });

  test('returns element by index', async () => {
    expect(splitString('some,string,here', 2)).to.equal('here');
  });

  test('returns undefined if index outside range', async () => {
    expect(splitString('some,string,here', 3)).to.equal(undefined);
  });

  test('supports custom separator', async () => {
    expect(splitString('some,string,here|hello', 1, '|')).to.equal('hello');
  });

  test('defaults to empty string if none supplied', async () => {
    expect(splitString()).to.equal('');
  });

  test('defaults to empty string if none supplied', async () => {
    expect(splitString('', 1)).to.equal(undefined);
  });
});
