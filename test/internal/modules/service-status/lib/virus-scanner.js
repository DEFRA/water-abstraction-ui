'use strict';
const Lab = require('lab');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const virusScanner = require('../../../../../src/internal/modules/service-status/lib/virus-scanner');
const fileCheck = require('../../../../../src/internal/lib/file-check');
const { expect } = require('code');

experiment('getVirusScannerStatus', () => {
  let stub;

  const sandbox = sinon.sandbox.create();

  beforeEach(async () => {
    stub = sandbox.stub(fileCheck, 'virusCheck');
    stub.onCall(0).resolves(true);
    stub.onCall(1).resolves(false);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should return true if clean file passes and infected file fails', async () => {
    const result = await virusScanner.getVirusScannerStatus();
    expect(result).to.equal(true);
  });

  test('it should return false if clean file fails', async () => {
    stub.onCall(0).resolves(false);
    const result = await virusScanner.getVirusScannerStatus();
    expect(result).to.equal(false);
  });

  test('it should return false if infected file succeeds', async () => {
    stub.onCall(1).resolves(true);
    const result = await virusScanner.getVirusScannerStatus();
    expect(result).to.equal(false);
  });

  test('it should return false if clean file fails and infected file succeeds', async () => {
    stub.onCall(0).resolves(false);
    stub.onCall(1).resolves(true);
    const result = await virusScanner.getVirusScannerStatus();
    expect(result).to.equal(false);
  });
});
