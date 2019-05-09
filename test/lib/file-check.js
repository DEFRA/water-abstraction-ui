const sinon = require('sinon');
const { expect } = require('code');
const Lab = require('lab');
const helpers = require('../../src/lib/helpers');

const fileCheck = require('../../src/lib/file-check');
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script();

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

experiment('clamScan', () => {
  let stub;

  beforeEach(async () => {
    stub = sinon.stub(helpers, 'exec').resolves('OK');
  });

  afterEach(async () => {
    stub.restore();
  });

  test('It should call exec with the correct command', async () => {
    await fileCheck.clamScan('test.txt');
    expect(helpers.exec.firstCall.args).to.equal(['clamdscan test.txt']);

    stub.restore();
  });
});

experiment('virusCheck', () => {
  let stub;

  beforeEach(async () => {
    stub = sinon.stub(helpers, 'exec');
  });

  afterEach(async () => {
    stub.restore();
  });

  test('It should throw an error if the file does not exist', async () => {
    stub.rejects();
    const func = () => {
      return fileCheck.virusCheck('test/lib/test-files/no-file-here.txt');
    };
    expect(func()).to.reject();
  });

  test('It should resolve to true if a file does not contain a virus', async () => {
    stub.resolves();
    const result = await fileCheck.virusCheck('test/lib/test-files/test-file.txt');
    expect(result).to.equal(true);
  });

  test('It should resolve to false if a file contains a virus', async () => {
    const err = new Error();
    err.code = 1;
    stub.rejects(err);
    const result = await fileCheck.virusCheck('test/lib/test-files/eicar-test.txt');
    expect(result).to.equal(false);
  });
});

experiment('detectFileType', () => {
  test('throws an error if the file does not exist', async () => {
    const func = () => fileCheck.detectFileType('no-file-here.sorry');
    expect(func()).to.reject();
  });

  test('returns "xml" if the file is XML', async () => {
    const result = await fileCheck.detectFileType('test/lib/test-files/test-xml.xml');
    expect(result).to.equal('xml');
  });

  test('returns "csv" if the file is CSV', async () => {
    const result = await fileCheck.detectFileType('test/lib/test-files/test-file.csv');
    expect(result).to.equal('csv');
  });
});
