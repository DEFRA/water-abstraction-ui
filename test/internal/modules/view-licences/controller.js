const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

const controller = require('internal/modules/view-licences/controller');
const services = require('internal/lib/connectors/services');
const { scope } = require('internal/lib/constants');

experiment('internal view licences controller', () => {
  experiment('getExpiredLicence', () => {
    let request, h;

    beforeEach(async () => {
      sandbox.stub(services.returns.returns, 'getLicenceReturns').resolves({
        data: [{
          return_id: 'return_1',
          start_date: '2018-04-01',
          end_date: '2019-03-31',
          status: 'due'
        }]
      });

      request = {
        params: {
          documentId: 'document_1'
        },
        auth: {
          credentials: {
            scope: [scope.returns]
          }
        },
        licence: {
          licence: {
            licence_ref: '01/123',
            earliestEndDate: '2019-07-04',
            earliestEndDateReason: 'lapsed'
          },
          communications: [],
          chargeVersions: [
            { versionNumber: 101 },
            { versionNumber: 103 },
            { versionNumber: 102 }
          ]
        }
      };

      h = {
        view: sandbox.stub()
      };
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('gets licence returns with correct licence number and pagination', async () => {
      await controller.getExpiredLicence(request, h);
      const [ licenceNumbers, pagination ] = services.returns.returns.getLicenceReturns.lastCall.args;
      expect(licenceNumbers).to.equal(['01/123']);
      expect(pagination).to.equal({ page: 1, perPage: 10 });
    });

    test('uses correct template', async () => {
      await controller.getExpiredLicence(request, h);
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/view-licences/expired-licence.njk');
    });

    test('outputs correct data to view', async () => {
      await controller.getExpiredLicence(request, h);
      const [ , view ] = h.view.lastCall.args;
      expect(view.licence.licenceNumber).to.equal('01/123');
      expect(view.licence.expiryDate).to.equal('4 July 2019');
      expect(view.licence.expiryReason).to.equal('lapsed');
      expect(view.returns).to.be.an.array();
      expect(view.communications).to.be.an.array();
      expect(view.pageTitle).to.equal('Lapsed licence 01/123');
      expect(view.documentId).to.equal(request.params.documentId);
    });

    test('adds the charge versions sorted by version number', async () => {
      await controller.getExpiredLicence(request, h);
      const [ , view ] = h.view.lastCall.args;
      expect(view.chargeVersions).to.equal([
        { versionNumber: 103 },
        { versionNumber: 102 },
        { versionNumber: 101 }
      ]);
    });

    test('sets showChargeVersions to false if user does not have charging scope', async () => {
      await controller.getExpiredLicence(request, h);
      const [ , view ] = h.view.lastCall.args;
      expect(view.showChargeVersions).to.be.false();
    });

    test('sets showChargeVersions to true if user has the charging scope', async () => {
      request.auth = {
        credentials: {
          scope: ['charging']
        }
      };
      await controller.getExpiredLicence(request, h);
      const [ , view ] = h.view.lastCall.args;
      expect(view.showChargeVersions).to.be.true();
    });

    test('adds links to the returns', async () => {
      await controller.getExpiredLicence(request, h);
      const [ , view ] = h.view.lastCall.args;
      expect(view.returns[0].path).to.be.a.string();
      expect(view.returns[0].isEdit).to.be.a.boolean();
    });
  });
});
