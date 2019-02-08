const fileCheck = require('../../src/lib/file-check');
const { expect } = require('code');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

experiment('throwIfFileDoesNotExist', () => {
  test('It returns true if file exists', async () => {
    const result = fileCheck.throwIfFileDoesNotExist('test/lib/test-files/test-file.txt');
    expect(result).to.equal(true);
  });

  test('It throws an error if the file does not exist', async () => {
    const func = () => {
      fileCheck.throwIfFileDoesNotExist('test/lib/test-files/no-file-here.txt');
    };
    expect(func).to.throw();
  });
});

experiment('virusCheck', () => {
  test('It should resolve to true if a file does not contain a virus', async () => {
    const result = await fileCheck.virusCheck('test/lib/test-files/test-file.txt');
    expect(result).to.equal(true);
  });

  test('It should throw an error if it contains a virus', async () => {
    const func = () => {
      return fileCheck.virusCheck('test/lib/test-files/eicar-test.txt');
    };
    expect(func()).to.reject();
  });
});

experiment('isXml', async () => {
  test('It should return true if the file is XML', async () => {
    const result = await fileCheck.isXml('test/lib/test-files/test-xml.xml');
    expect(result).to.equal(true);
  });

  test('It should return false if the file is XML', async () => {
    const result = await fileCheck.isXml('test/lib/test-files/test-file.txt');
    expect(result).to.equal(false);
  });
});
