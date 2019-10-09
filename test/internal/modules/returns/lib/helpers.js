'use strict';

const { expect } = require('@hapi/code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { get } = require('lodash');

const services = require('internal/lib/connectors/services');
const helpers = require('internal/modules/returns/lib/helpers');

experiment('getLicenceReturns', () => {
  beforeEach(async () => {
    sandbox.stub(services.returns.returns, 'findMany').resolves({
      data: {},
      error: null,
      pagination: {}
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('does not filter void returns for internal users', async () => {
    await helpers.getLicenceReturns([], 1, true);
    const filter = services.returns.returns.findMany.args[0][0];
    expect(get(filter, 'status.$ne')).to.be.undefined();
  });
});

experiment('getLicenceNumbers', () => {
  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'findAll').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('requests the required columns', async () => {
    await helpers.getLicenceNumbers({});
    const [, , columns] = services.crm.documents.findAll.lastCall.args;
    expect(columns).to.only.include([
      'system_external_id',
      'document_name',
      'document_id',
      'metadata'
    ]);
  });

  test('includes expired licences for internal users', async () => {
    const request = {
      auth: {
        credentials: {
          scope: ['internal']
        }
      }
    };
    await helpers.getLicenceNumbers(request);
    const [ filter ] = services.crm.documents.findAll.lastCall.args;
    expect(get(filter, 'includeExpired')).to.equal(true);
  });
});

experiment('getViewData', () => {
  beforeEach(async () => {
    sandbox.stub(services.crm.documents, 'getWaterLicence').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('internal users can see expired documents', async () => {
    const internalRequest = {
      auth: {
        credentials: {
          scope: ['internal']
        }
      }
    };

    const data = { licenceNumber: '123' };

    await helpers.getViewData(internalRequest, data);
    const [licenceNumber, isInternal] = services.crm.documents.getWaterLicence.lastCall.args;

    expect(licenceNumber).to.equal('123');
    expect(isInternal).to.be.true();
  });
});
