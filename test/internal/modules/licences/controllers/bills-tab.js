const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  after,
  before
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controllers = require('internal/modules/licences/controllers/bills-tab');
const viewLicenceLib = require('internal/lib/view-licence-config');
const services = require('internal/lib/connectors/services');

experiment('internal/modules/billing/controllers/bills-tab', () => {
  before(async () => {
    sandbox.stub(services.water.licences, 'getDocumentByLicenceId').resolves({
      metadata: {},
      system_external_id: 'test id'
    });
    sandbox.stub(viewLicenceLib, 'getLicenceInvoices').resolves({ data: [] });
  });

  after(async () => {
    sandbox.restore();
  });

  experiment('.getBillsForLicence', () => {
    let h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns(),
      redirect: sandbox.stub()
    };
    const tempLicenceId = uuid();
    const request = {
      view: {},
      params: {
        licenceId: tempLicenceId

      },
      query: {
        page: 1
      }
    };
    beforeEach(async () => {
      await controllers.getBillsForLicence(request, h);
    });

    test('calls getDocumentByLicenceId', () => {
      expect(services.water.licences.getDocumentByLicenceId.calledWith(tempLicenceId)).to.be.true();
    });
    test('calls getLicenceInvoices', () => {
      expect(viewLicenceLib.getLicenceInvoices.calledWith(tempLicenceId, 1, 0)).to.be.true();
    });
    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1]);

      expect(keys).to.include(['pageTitle', 'subHeading', 'caption', 'bills', 'back']);
    });
  });
});
