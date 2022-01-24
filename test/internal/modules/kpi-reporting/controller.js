const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../../src/internal/modules/kpi-reporting/controller');
const services = require('internal/lib/connectors/services');

experiment('modules/account/controller', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getKPIDashboard', () => {
    let h;

    const returnCycles = [{
      startDate: '2019-01-01',
      totalCount: 100,
      voidCount: 20
    }, {
      startDate: '2020-01-01',
      totalCount: 90,
      voidCount: 15
    }];

    beforeEach(async () => {
      h = { view: sandbox.spy() };
      sandbox.stub(services.water.kpiReporting, 'getKpiData').resolves({
        data: {
          returnCycles
        }
      });

      const request = {
        defra: { userName: 'test-user' }
      };

      await controller.getKPIDashboard(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/kpi-reporting/dashboard');
    });

    test('the kpi-reporting service is called once', async () => {
      expect(services.water.kpiReporting.getKpiData.lastCall.proxy.calledOnce).to.be.true();
    });

    test('the return cycles are set in the view in reverse date order', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.returnCycles[0].startDate).to.equal(returnCycles[1].startDate);
      expect(view.returnCycles[1].startDate).to.equal(returnCycles[0].startDate);
    });

    test('the return cycle total excluding voids is included', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.returnCycles[0].totalExcludingVoid).to.equal(75);
      expect(view.returnCycles[1].totalExcludingVoid).to.equal(80);
    });
  });
});
