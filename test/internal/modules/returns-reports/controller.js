'use strict';
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-reports/controller');
const services = require('internal/lib/connectors/services');

const request = {
  params: {
    cycleEndDate: '2018-10-31'
  }
};

const errorResponse = {
  error: 'Some error',
  data: 'null'
};

const successResponse = {
  error: null,
  data: [
    {
      return_id: 'v1:123'
    }
  ]
};

experiment('getDownloadReport', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(services.returns.returns, 'getReport');
    h = {
      response: sinon.stub().returns({
        header: sinon.stub().returnsThis()
      })
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('It should throw an error if API returns error', async () => {
    services.returns.returns.getReport.resolves(errorResponse);
    const func = () => controller.getDownloadReport(request);
    expect(func()).to.reject();
  });

  test('It should download a CSV if success response', async () => {
    services.returns.returns.getReport.resolves(successResponse);
    await controller.getDownloadReport(request, h);
    expect(h.response.firstCall.args[0]).to.equal('return_id\nv1:123\n');
  });
});
