const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const {
  commaOrLineSeparatedValuesToCsv,
  splitString
} = require('../../src/lib/string-formatter.js');

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

experiment('commaOrLineSeparatedValuesToCsv', () => {
  test('handles line separated values', async () => {
    const values = '123\r\n234';
    const asCsv = commaOrLineSeparatedValuesToCsv(values);
    expect(asCsv).to.equal('123,234');
  });

  test('handles comma separated values', async () => {
    const values = '123,234';
    const asCsv = commaOrLineSeparatedValuesToCsv(values);
    expect(asCsv).to.equal('123,234');
  });

  test('handles a mix of line and comma separated values', async () => {
    const values = '1,2\r\n3\r\n4,5';
    const asCsv = commaOrLineSeparatedValuesToCsv(values);
    expect(asCsv).to.equal('1,2,3,4,5');
  });

  test('trims each item', async () => {
    const values = ' 1 , 2\r\n3 \r\n 4 , 5';
    const asCsv = commaOrLineSeparatedValuesToCsv(values);
    expect(asCsv).to.equal('1,2,3,4,5');
  });

  test('handes a single item', async () => {
    const values = '1';
    const asCsv = commaOrLineSeparatedValuesToCsv(values);
    expect(asCsv).to.equal('1');
  });

  test('handles an empty string', async () => {
    expect(commaOrLineSeparatedValuesToCsv('')).to.equal('');
  });

  test('handles undefined input', async () => {
    expect(commaOrLineSeparatedValuesToCsv()).to.equal('');
  });

  test('handles null input', async () => {
    expect(commaOrLineSeparatedValuesToCsv(null)).to.equal('');
  });
});
