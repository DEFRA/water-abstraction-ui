'use strict';
const sinon = require('sinon');
const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();

const plugin = require('external/modules/returns/plugin');
const services = require('external/lib/connectors/services');

const sandbox = sinon.createSandbox();

const licence = '123/456';
const returnId = `v1:1:${licence}:1234:2018-11-01:2019-10-31`;
const companyId = 'company_1';

const createRequest = (isLoadOption) => ({
  query: {
    returnId
  },
  defra: {
    companyId
  },
  auth: {
    credentials: {
      scope: ['external', 'primary_user']
    }
  },
  route: {
    settings: {
      plugins: {
        returns: isLoadOption
      }
    }
  }
});

experiment('returns plugin', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'getWaterLicence')
      .resolves({ document_id: 'abc', company_entity_id: companyId });
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      continue: 'continue'
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('for external users', () => {
    let request;

    experiment('when load config option is set', () => {
      beforeEach(async () => {
        request = createRequest(true);
      });

      test('extracts the licence number from the return ID and loads document header', async () => {
        await plugin._handler(request, h);
        const [licenceNumber] = services.crm.documents.getWaterLicence.lastCall.args;
        expect(licenceNumber).to.equal(licence);
      });

      test('places the document header in request.view', async () => {
        await plugin._handler(request, h);
        expect(request.view.documentHeader).to.be.an.object();
      });

      test('throws an error if the document header is not loaded', async () => {
        services.crm.documents.getWaterLicence.resolves();
        const func = () => plugin._handler(request, h);
        expect(func()).to.reject();
      });

      test('throws an error if the document header company ID does not match the current user', async () => {
        request.defra.companyId = 'some-other-company';
        const func = () => plugin._handler(request, h);
        expect(func()).to.reject();
      });
    });

    experiment('when load config option not set', () => {
      beforeEach(async () => {
        request = createRequest(false);
      });

      test('loads data from session', async () => {
        await plugin._handler(request, h);
        expect(services.crm.documents.getWaterLicence.callCount).to.equal(0);
      });
    });
  });
});
