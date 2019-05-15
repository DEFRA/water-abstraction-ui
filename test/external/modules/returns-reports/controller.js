'use strict';
const sinon = require('sinon');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const controller = require('../../../../src/external/modules/returns-reports/controller');
const { returns } = require('../../../../src/external/lib/connectors/returns');

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

lab.experiment('getDownloadReport', () => {
  let stub;
  let h;

  lab.beforeEach(async () => {
    stub = sinon.stub(returns, 'getReport');
    h = {
      response: sinon.stub().returns({
        header: sinon.stub().returnsThis()
      })
    };
  });

  lab.afterEach(async () => {
    stub.restore();
  });

  lab.test('It should throw an error if API returns error', async () => {
    stub.resolves(errorResponse);
    const func = () => controller.getDownloadReport(request);
    expect(func()).to.reject();
  });

  lab.test('It should download a CSV if success response', async () => {
    stub.resolves(successResponse);
    await controller.getDownloadReport(request, h);
    expect(h.response.firstCall.args[0]).to.equal('return_id\nv1:123\n');
  });
});
