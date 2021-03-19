'use strict';
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/returns-reports/controller');
const csv = require('internal/lib/csv-download');

const returnCycleId = 'test-id-1';

const data = {
  report: [{
    id: returnCycleId,
    dateRange: {
      startDate: '2020-04-01',
      endDate: '2021-03-31'
    }
  }, {
    id: 'test-id-2',
    dateRange: {
      startDate: '2019-04-01',
      endDate: '2020-03-31'
    }
  }, {
    id: 'test-id-3',
    dateRange: {
      startDate: '2018-04-01',
      endDate: '2019-03-31'
    }
  }],
  returns: [{
    id: 'test-id',
    licenceRef: '01/123/ABC',
    returnRequirement: '0123',
    returnsFrequency: 'day',
    dateRange: {
      startDate: '2020-04-01',
      endDate: '2021-03-31'
    },
    dueDate: '2021-04-28',
    receivedDate: '2021-04-25',
    user: {
      email: 'bob@example.com'
    },
    userType: 'external'
  }]
};

experiment('internal/modules/returns-reports/controller.js', () => {
  let h, request;

  beforeEach(async () => {
    sandbox.stub(services.water.returnCycles, 'getReport').resolves({ data: data.report });
    sandbox.stub(services.water.returnCycles, 'getReturnCycleById');
    sandbox.stub(services.water.returnCycles, 'getReturnCycleReturns').resolves({ data: data.returns });

    sandbox.stub(csv, 'csvDownload');
    h = {
      response: sandbox.stub().returns({
        header: sandbox.stub().returnsThis()
      }),
      view: sandbox.stub()
    };
    request = {
      params: {
        returnCycleId
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturnCycles', () => {
    beforeEach(async () => {
      await controller.getReturnCycles(request, h);
    });

    test('calls the water service api', async () => {
      expect(services.water.returnCycles.getReport.called).to.be.true();
    });

    test('uses the correct template', async () => {
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns-reports/index');
    });

    test('outputs the most recent cycle to the view', async () => {
      const [ , { currentCycle } ] = h.view.lastCall.args;
      expect(currentCycle.id).to.equal('test-id-1');
    });

    test('outputs the other cycles to the view sorted by date descending', async () => {
      const [ , { cycles } ] = h.view.lastCall.args;
      expect(cycles).to.be.an.array().length(2);
      expect(cycles[0].id).to.equal('test-id-2');
      expect(cycles[1].id).to.equal('test-id-3');
    });
  });

  experiment('.getConfirmDownload', () => {
    beforeEach(async () => {
      services.water.returnCycles.getReturnCycleById.resolves(
        data.report[0]
      );
      await controller.getConfirmDownload(request, h);
    });

    test('calls the water service api', async () => {
      expect(services.water.returnCycles.getReturnCycleById.calledWith(
        returnCycleId
      )).to.be.true();
    });

    test('uses the correct template', async () => {
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns-reports/confirm-download');
    });

    test('outputs a page title', async () => {
      const [ , { pageTitle } ] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Download returns report for 1 April 2020 to 31 March 2021');
    });

    test('outputs a back link', async () => {
      const [ , { back } ] = h.view.lastCall.args;
      expect(back).to.equal('/returns-reports');
    });

    test('outputs a download link', async () => {
      const [ , { link } ] = h.view.lastCall.args;
      expect(link).to.equal(`/returns-reports/download/${returnCycleId}`);
    });
  });

  experiment('.getDownloadReport', () => {
    beforeEach(async () => {
      services.water.returnCycles.getReturnCycleById.resolves(
        data.report[0]
      );
      await controller.getDownloadReport(request, h);
    });

    test('calls the water service api to get the cycle', async () => {
      expect(services.water.returnCycles.getReturnCycleById.calledWith(
        returnCycleId
      )).to.be.true();
    });

    test('calls the water service api to get returns in the cycle', async () => {
      expect(services.water.returnCycles.getReturnCycleReturns.calledWith(
        returnCycleId
      )).to.be.true();
    });

    test('outputs the csv file', async () => {
      const { args } = csv.csvDownload.lastCall;

      expect(args[0]).to.equal(h);
      expect(args[1]).to.equal([{
        'Return ID': 'test-id',
        'Licence number': '01/123/ABC',
        'Return reference': '0123',
        Frequency: 'day',
        'Start date': '2020-04-01',
        'End date': '2020-04-01',
        'Due date': '2021-04-28',
        Status: undefined,
        'Date received': '2021-04-25',
        'Submitted by': 'bob@example.com',
        'User type': 'external'
      }]);
      expect(args[2]).to.equal('1 April 2020 to 31 March 2021 winter/all year returns.csv');
    });
  });
});
