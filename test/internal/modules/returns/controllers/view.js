const sinon = require('sinon');
const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { experiment, test, afterEach, beforeEach, fail } = exports.lab = Lab.script();
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns/controllers/view');
const helpers = require('internal/modules/returns/lib/helpers');
const services = require('internal/lib/connectors/services');
const returnHelpers = require('internal/modules/returns/lib/return-helpers');

const request = {
  query: {
    id: 'test-id',
    version: 1
  },
  params: {
    documentId: 'test-document-id'
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

experiment('internal view controller', async () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getReturnsViewData');
    sandbox.stub(helpers, 'getLicenceNumbers');
    sandbox.stub(returnHelpers, 'getLinesWithReadings');
    sandbox.stub(services.water.returns, 'getReturn');
  });

  afterEach(async () => { sandbox.restore(); });

  experiment('getReturnsForLicence', async () => {
    test('correct template is passed', async () => {
      helpers.getReturnsViewData.returns({ document: { system_external_id: 'lic-1234' } });
      await controller.getReturnsForLicence(request, h);

      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/licence');
      expect(view).to.contain(['back', 'backText', 'document', 'pageTitle', 'paginationUrl']);
      expect(view.back).to.equal(`/licences/${request.params.documentId}`);
      expect(view.backText).to.equal(`Licence number ${view.document.system_external_id}`);
      expect(view.document).to.equal({ system_external_id: 'lic-1234' });
      expect(view.pageTitle).to.equal(`Returns for licence number ${view.document.system_external_id}`);
      expect(view.paginationUrl).to.equal(`/licences/${request.params.documentId}/returns`);
    });

    test('throws a Boom 404 error if the document is not found', async () => {
      const errorMessage = `Document ${request.params.documentId} not found - entity ${request.defra.entityId} may not have the correct roles`;
      helpers.getReturnsViewData.returns({});
      try {
        await controller.getReturnsForLicence(request, h);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.message).to.equal(errorMessage);
        expect(err.output.statusCode).to.equal(404);
      }
    });
  });

  experiment('getReturn', async () => {
    beforeEach(async () => {
      helpers.getLicenceNumbers.returns([{ documentHeader: 'test-doc-header' }]);
      returnHelpers.getLinesWithReadings.returns([{ test: 'lines' }]);
    });
    test('correct template is passed', async () => {
      const returnData = testData(true);
      services.water.returns.getReturn.returns(returnData);
      await controller.getReturn(request, h);

      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/return');
      expect(view.data.isCurrent).to.equal(returnData.isCurrent);
      expect(view.data.licenceNumber).to.equal(returnData.licenceNumber);
      expect(view.data.metadata).to.equal(returnData.metadata);
      expect(view.lines).to.equal([{ test: 'lines' }]);
      expect(view.documentHeader).to.equal({ documentHeader: 'test-doc-header' });
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
