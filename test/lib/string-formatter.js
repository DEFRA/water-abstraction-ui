const Lab = require('lab');
const lab = Lab.script();
const { expect } = require('code');

const { splitString } = require('../../src/lib/string-formatter.js');

lab.experiment('Test splitString', () => {
  lab.test('Should split string by commas and return first element by default', async () => {
    expect(splitString('some,string,here')).to.equal('some');
  });

  lab.test('Should return element by index', async () => {
    expect(splitString('some,string,here', 2)).to.equal('here');
  });

  lab.test('Should return undefined if index outside range', async () => {
    expect(splitString('some,string,here', 3)).to.equal(undefined);
  });

  lab.test('Should support custom separator', async () => {
    expect(splitString('some,string,here|hello', 1, '|')).to.equal('hello');
  });

  lab.test('Should default to empty string if none supplied', async () => {
    expect(splitString()).to.equal('');
  });

  lab.test('Should default to empty string if none supplied', async () => {
    expect(splitString('', 1)).to.equal(undefined);
  });
});

exports.lab = lab;
