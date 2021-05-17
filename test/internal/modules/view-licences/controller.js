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

const controllers = require('internal/modules/view-licences/controller');
const services = require('internal/lib/connectors/services');

experiment('internal/modules/billing/controllers/bills-tab', () => {
  before(async () => {
    sandbox.stub(services.water.licences, 'getDocumentByLicenceId').resolves({
      metadata: {},
      system_external_id: 'test id'
    });
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
      pre: {
        document: {
          metadata: {
            Name: 'test-name'
          }
        },
        bills: [

        ]
      },
      query: {
        page: 1
      }
    };
    beforeEach(async () => {
      await controllers.getBillsForLicence(request, h);
    });

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1]);

      expect(keys).to.include([
        'pageTitle',
        'caption',
        'tableCaption',
        'bills',
        'pagination',
        'licenceId',
        'back']);
    });
  });
});
