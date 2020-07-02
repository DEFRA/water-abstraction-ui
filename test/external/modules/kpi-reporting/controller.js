const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('external/modules/kpi-reporting/controller');
const services = require('external/lib/connectors/services');

experiment('modules/account/controller', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getKPIDashboard', () => {
    let h;

    beforeEach(async () => {
      h = { view: sandbox.spy() };
      sandbox.stub(services.water.kpiReporting, 'getKpiData').resolves({ data: {} });

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
  });
});
