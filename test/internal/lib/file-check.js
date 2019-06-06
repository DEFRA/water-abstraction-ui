const sinon = require('sinon');
const { expect } = require('code');
const Lab = require('lab');
const childProcessHelpers = require('../../../src/shared/lib/child-process-helpers');
const { logger } = require('../../../src/internal/logger');

const fileCheck = require('../../../src/internal/lib/file-check');
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script();

const sandbox = sinon.createSandbox();

experiment('throwIfFileDoesNotExist', () => {
  test('It returns true if file exists', async () => {
    const result = fileCheck.throwIfFileDoesNotExist('test/external/lib/test-files/test-file.txt');
    expect(result).to.equal(true);
  });

  test('It throws an error if the file does not exist', async () => {
    const func = () => {
      fileCheck.throwIfFileDoesNotExist('test/external/lib/test-files/no-file-here.txt');
    };
    expect(func).to.throw();
  });
});

experiment('clamScan', () => {
  beforeEach(async () => {
    sandbox.stub(childProcessHelpers, 'exec').resolves('OK');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should call exec with the correct command', async () => {
    await fileCheck.clamScan('test.txt');
    expect(childProcessHelpers.exec.firstCall.args).to.equal(['clamdscan test.txt']);
  });
});

experiment('virusCheck', () => {
  beforeEach(async () => {
    sandbox.stub(childProcessHelpers, 'exec');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should throw an error if the file does not exist', async () => {
    childProcessHelpers.exec.rejects();
    const func = () => {
      return fileCheck.virusCheck('test/external/lib/test-files/no-file-here.txt');
    };
    expect(func()).to.reject();
  });

  test('It should resolve to true if a file does not contain a virus', async () => {
    childProcessHelpers.exec.resolves();
    const result = await fileCheck.virusCheck('test/external/lib/test-files/test-file.txt');
    expect(result).to.equal(true);
  });

  test('It should resolve to false if a file contains a virus', async () => {
    const err = new Error();
    err.code = 1;
    childProcessHelpers.exec.rejects(err);
    const result = await fileCheck.virusCheck('test/external/lib/test-files/eicar-test.txt');
    expect(result).to.equal(false);
  });
});

experiment('detectFileType', () => {
  test('throws an error if the file does not exist', async () => {
    const func = () => fileCheck.detectFileType('no-file-here.sorry');
    expect(func()).to.reject();
  });

  test('returns "xml" if the file is XML', async () => {
    const result = await fileCheck.detectFileType('test/external/lib/test-files/test-xml.xml');
    expect(result).to.equal('xml');
  });

  test('returns "csv" if the file is CSV', async () => {
    const result = await fileCheck.detectFileType('test/external/lib/test-files/test-file.csv');
    expect(result).to.equal('csv');
  });
});

experiment('isCsv', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('resolves with true when a CSV file path is supplied', async () => {
    const result = await fileCheck._isCsv('test/external/lib/test-files/test-file.csv');
    expect(result).to.equal(true);
  });

  test('resolves with false and logs message when a non-CSV file path is supplied', async () => {
    const result = await fileCheck._isCsv('test/external/lib/test-files/test-xml.xml');
    expect(result).to.equal(false);
    expect(logger.info.callCount).to.equal(1);
  });
});
