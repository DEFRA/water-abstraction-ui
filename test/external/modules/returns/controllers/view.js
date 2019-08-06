const sinon = require('sinon');
const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script();
const sandbox = sinon.createSandbox();

const controller = require('external/modules/returns/controllers/view');
const helpers = require('external/modules/returns/lib/helpers');
const services = require('external/lib/connectors/services');
const WaterReturn = require('shared/modules/returns/models/WaterReturn');

const request = {
  query: {
    id: 'test-id',
    version: 1
  },
  defra: {
    entityId: 'test-entity-id'
  }
};

const h = {
  view: sandbox.stub()
};

const testData = isCurrent => {
  return {
    licenceNumber: '123-abc',
    isCurrent,
    lines: [{
      startDate: '2012-01-01'
    }],
    meters: [{}],
    metadata: {
      isCurrent
    } };
};

experiment('view controlller', async () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getReturnsViewData');
    sandbox.stub(helpers, 'getLicenceNumbers');
    sandbox.stub(services.water.returns, 'getReturn');
    sandbox.stub(WaterReturn.prototype, 'constructor');
  });

  afterEach(async () => { sandbox.restore(); });

  experiment('getReturns', async () => {
    beforeEach(async () => {
      helpers.getReturnsViewData.returns({ test: 'data' });
      await controller.getReturns(request, h);
    });
    test('correct template is passed', async () => {
      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/index.njk');
      expect(view).to.equal({ test: 'data' });
    });
  });

  experiment('getReturn', async () => {
    beforeEach(async () => {
      helpers.getLicenceNumbers.returns([{ documentHeader: 'test-doc-header' }]);
      WaterReturn.prototype.constructor.returns({ metadata: { isCurrent: true } });
    });
    test('correct template is passed', async () => {
      const returnData = testData(true);
      services.water.returns.getReturn.returns(returnData);
      await controller.getReturn(request, h);

      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/return.njk');
      expect(view.data.isCurrent).to.equal(returnData.isCurrent);
      expect(view.data.licenceNumber).to.equal(returnData.licenceNumber);
      expect(view.data.lines).to.equal(returnData.lines);
      expect(view.data.metadata).to.equal(returnData.metadata);
    });

    test('Boom error is thrown if !canView', async () => {
      services.water.returns.getReturn.returns(testData(false));
      try {
        await controller.getReturn(request, h);
      } catch (err) {
        expect(err.isBoom).to.be.true();
        expect(err.message).to.equal('Access denied return test-id for entity test-entity-id');
      }
    });
  });
});
