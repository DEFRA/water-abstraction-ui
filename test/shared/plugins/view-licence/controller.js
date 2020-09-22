'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { scope } = require('internal/lib/constants');
const controller = require('../../../../src/shared/plugins/view-licence/controller');

experiment('shared/plugins/view-licence/controller', () => {
  let h;
  let request;
  let documentId;
  let licenceId;

  beforeEach(async () => {
    documentId = '00000000-0000-0000-0000-000000001111';
    licenceId = '00000000-0000-0000-0000-000000002222';

    request = {
      params: {
        documentId
      },
      licence: {
        chargeVersions: [
          { versionNumber: 100 },
          { versionNumber: 101 },
          { versionNumber: 102 }
        ],
        summary: {
          licenceNumber: '123/123',
          waterLicence: {
            id: licenceId
          }
        }
      },
      view: {
      },
      auth: {
        credentials: {
          scope: scope.charging
        }
      }
    };

    h = {
      view: sandbox.stub(),
      realm: {
        pluginOptions: {
          getLicenceSummaryReturns: sandbox.stub(),
          getReturnPath: sandbox.stub(),
          canShowCharging: sandbox.stub(),
          getLicenceAgreements: sandbox.stub()
        }
      }
    };
  });

  experiment('.getLicence', () => {
    let view;

    beforeEach(async () => {
      h.realm.pluginOptions.getLicenceSummaryReturns.resolves({
        data: [],
        pagination: { pageCount: 1 }
      });

      h.realm.pluginOptions.getLicenceAgreements.resolves([
        { id: '0000000-0000-0000-0000-000000003333' }
      ]);

      h.realm.pluginOptions.canShowCharging.returns(true);

      await controller.getLicence(request, h);
      view = h.view.lastCall.args[1];
    });

    test('uses the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/view-licences/licence');
    });

    test('adds the page title to the view object', async () => {
      expect(view.pageTitle).to.equal('Licence number 123/123');
    });

    test('sets hasMoreReturns to false because there is only one page', async () => {
      expect(view.hasMoreReturns).to.equal(false);
    });

    test('sets the back link', async () => {
      expect(view.back).to.equal('/licences');
    });

    test('sets showChargeVersions', async () => {
      expect(view.showChargeVersions).to.equal(true);
    });

    test('sets the sorted charge versions', async () => {
      expect(view.chargeVersions).to.equal([
        { versionNumber: 102 },
        { versionNumber: 101 },
        { versionNumber: 100 }
      ]);
    });

    test('sets the agreements', async () => {
      expect(view.agreements).to.equal([
        { id: '0000000-0000-0000-0000-000000003333' }
      ]);
    });

    test('sets the licence id', async () => {
      expect(view.licenceId).to.equal(licenceId);
    });

    test('sets isChargingUser', () => {
      expect(view.isChargingUser).to.be.true();
    });
  });
});
