const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const serviceRequest = require('shared/lib/connectors/service-request');
const companyConnector = require('internal/lib/connectors/water-service/company');

const { returns: { date: { createReturnCycles } } } = require('@envage/water-abstraction-helpers');
const { last } = require('lodash');

experiment('getCurrentDueReturns', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the service request', async () => {
    await companyConnector.getCurrentDueReturns('entity_1');
    const expectedUrl = `http://127.0.0.1:8001/water/1.0/company/entity_1/returns`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });

  test('passes the expected options to the service request', async () => {
    const cycle = last(createReturnCycles());
    await companyConnector.getCurrentDueReturns('entity_1');
    const [, { qs }] = serviceRequest.get.lastCall.args;
    expect(qs.status).to.equal('due');
    expect(qs.startDate).to.equal(cycle.startDate);
    expect(qs.endDate).to.equal(cycle.endDate);
    expect(qs.isSummer).to.equal(cycle.isSummer);
  });
});
