'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('internal/logger');
const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/charging/controller');

experiment('internal/modules/charging/controller', () => {
  let h, request;

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getChargeVersion', () => {
    const documentId = 'document_1';
    const chargeVersionId = 'charge_version_1';
    const chargeVersion = {
      chargeVersionId
    };
    const licenceNumber = '01/123/456';

    beforeEach(async () => {
      sandbox.stub(logger, 'error');
      sandbox.stub(services.water.chargeVersions, 'getChargeVersion').resolves(chargeVersion);
      request = {
        params: {
          documentId,
          chargeVersionId
        },
        licence: {
          licence: {
            licence_ref: licenceNumber,
            earliestEndDate: null
          }
        }
      };
      h = {
        view: sandbox.stub()
      };
    });

    experiment('for a non-expired licence', () => {
      beforeEach(async () => {
        await controller.getChargeVersion(request, h);
      });

      test('calls the water charge versions API with correct params', async () => {
        expect(services.water.chargeVersions.getChargeVersion.calledWith(
          chargeVersionId
        )).to.be.true();
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/charging/charge-version.njk');
      });

      test('outputs correct data to the view', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.licenceTitle).to.equal(`Licence number ${licenceNumber}`);
        expect(view.back).to.equal(`/licences/${documentId}#charge`);
        expect(view.pageTitle).to.equal(`Licence charge for ${licenceNumber}`);
        expect(view.chargeVersion).to.equal(chargeVersion);
      });

      test('uses the correct view options', async () => {
        const [, , options] = h.view.lastCall.args;
        expect(options).to.equal({ layout: false });
      });
    });

    experiment('for an expired licence', () => {
      beforeEach(async () => {
        request.licence.licence.earliestEndDate = '2019-01-01';
        await controller.getChargeVersion(request, h);
      });

      test('the back link is to the expired licence page', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal(`/expired-licences/${documentId}#charge`);
      });
    });

    experiment('when an error occurs', () => {
      beforeEach(async () => {
        services.water.chargeVersions.getChargeVersion.rejects();
      });

      test('an error is logged and rethrown', async () => {
        try {
          await controller.getChargeVersion(request, h);
          fail();
        } catch (err) {
          const [message, error, params] = logger.error.lastCall.args;
          expect(message).to.equal(`getChargeVersion error`);
          expect(error).to.equal(err);
          expect(params).to.equal({ chargeVersionId, documentId });
        }
      });
    });
  });
});
