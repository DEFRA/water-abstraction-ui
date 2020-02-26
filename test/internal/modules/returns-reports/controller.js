'use strict';
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-reports/controller');
const services = require('internal/lib/connectors/services');
const csv = require('internal/lib/csv-download');

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
    sandbox.stub(csv, 'csvDownload');
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

  test('It should call csvDownload to create csv', async () => {
    services.returns.returns.getReport.resolves(successResponse);
    await controller.getDownloadReport(request, h);
    const [, data, filename] = csv.csvDownload.lastCall.args;
    expect(data).to.equal(successResponse.data);
    expect(filename).to.equal(`returns-report-${request.params.cycleEndDate}.csv`);
  });
});
