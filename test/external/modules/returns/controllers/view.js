const sinon = require('sinon');
const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script();
const sandbox = sinon.createSandbox();

const controller = require('external/modules/returns/controllers/view');
const helpers = require('external/modules/returns/lib/helpers');

const request = {};

const h = {
  view: sandbox.stub()
};

experiment('view controlller', async () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getReturnsViewData');
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
});
