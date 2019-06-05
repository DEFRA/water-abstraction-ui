'use strict';
const Lab = require('lab');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const connectors = require('../../../../../src/internal/modules/service-status/lib/connectors');
const IDM = require('../../../../../src/internal/lib/connectors/idm');
const CRM = require('../../../../../src/internal/lib/connectors/crm');
const water = require('../../../../../src/internal/lib/connectors/water');
const permits = require('../../../../../src/internal/lib/connectors/permit');

const { expect } = require('code');

const response = {
  data: [{
    id: 'id_1'
  }],
  pagination: {
    totalRows: 5
  }
};

const createClient = () => {
  return {
    findMany: sinon.stub().resolves(response)
  };
};

experiment('getCount', () => {
  let apiClient;

  beforeEach(async () => {
    apiClient = createClient();
  });

  test('it calls the API client with correct arguments', async () => {
    await connectors.getCount(apiClient);
    const [filter, sort, pagination] = apiClient.findMany.firstCall.args;

    expect(filter).to.equal({});
    expect(sort).to.equal({});
    expect(pagination).to.equal({ perPage: 1 });
  });

  test('gets number of records if call succeeds', async () => {
    const result = await connectors.getCount(apiClient);
    expect(result).to.equal(5);
  });

  test('throws error if error returned from API', async () => {
    apiClient.findMany.resolves({ error: 'Ooops!' });
    const func = () => {
      return connectors.getCount(apiClient);
    };
    expect(func()).to.reject();
  });

  test('throws error if API call rejects', async () => {
    apiClient.findMany.rejects();
    const func = () => {
      return connectors.getCount(apiClient);
    };
    expect(func()).to.reject();
  });
});

experiment('getKPIData', () => {
  let apiClient;

  beforeEach(async () => {
    apiClient = createClient();
  });

  test('gets data if call succeeds', async () => {
    const result = await connectors.getKPIData(apiClient);
    expect(result).to.equal(response.data);
  });

  test('throws error if error returned from API', async () => {
    apiClient.findMany.resolves({ error: 'Ooops!' });
    const func = () => {
      return connectors.getKPIData(apiClient);
    };
    expect(func()).to.reject();
  });

  test('throws error if API call rejects', async () => {
    apiClient.findMany.rejects();
    const func = () => {
      return connectors.getKPIData(apiClient);
    };
    expect(func()).to.reject();
  });
});

experiment('Connectors call correct APIs', () => {
  let sandbox;

  beforeEach(async () => {
    sandbox = sinon.sandbox.create();

    // IDM
    sandbox.stub(IDM.usersClient, 'findMany').resolves(response);
    sandbox.stub(IDM.kpi, 'findMany').resolves(response);

    // CRM
    sandbox.stub(CRM.documents, 'findMany').resolves(response);
    sandbox.stub(CRM.verification, 'findMany').resolves(response);
    sandbox.stub(CRM.kpi, 'findMany').resolves(response);

    // Water
    sandbox.stub(water.pendingImport, 'findMany').resolves(response);

    // Permits
    sandbox.stub(permits.licences, 'findMany').resolves(response);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('getIDMUserCount calls IDM users endpoint', async () => {
    await connectors.getIDMUserCount();
    expect(IDM.usersClient.findMany.callCount).to.equal(1);
  });

  test('getIDMKPIData calls IDM KPI endpoint', async () => {
    await connectors.getIDMKPIData();
    expect(IDM.kpi.findMany.callCount).to.equal(1);
  });

  test('getCRMDocumentCount calls CRM documents endpoint', async () => {
    await connectors.getCRMDocumentCount();
    expect(CRM.documents.findMany.callCount).to.equal(1);
  });

  test('getCRMKPIData calls CRM KPI endpoint', async () => {
    await connectors.getCRMKPIData();
    expect(CRM.kpi.findMany.callCount).to.equal(1);
  });

  test('getCRMVerificationCount calls CRM verification endpoint', async () => {
    await connectors.getCRMVerificationCount();
    expect(CRM.verification.findMany.callCount).to.equal(1);
  });

  test('getPermitCount calls permit repo licences endpoint', async () => {
    await connectors.getPermitCount();
    expect(permits.licences.findMany.callCount).to.equal(1);
    const [filter] = permits.licences.findMany.firstCall.args;
    expect(filter.licence_regime_id).to.equal(1);
    expect(filter.licence_type_id).to.equal(8);
  });

  test('getWaterPendingImports calls water pending import endpoint', async () => {
    await connectors.getWaterPendingImports();
    expect(water.pendingImport.findMany.callCount).to.equal(1);
    const [filter] = water.pendingImport.findMany.firstCall.args;
    expect(filter.status).to.equal(0);
  });

  test('getWaterCompletedImports calls water pending import endpoint', async () => {
    await connectors.getWaterCompletedImports();
    expect(water.pendingImport.findMany.callCount).to.equal(1);
    const [filter] = water.pendingImport.findMany.firstCall.args;
    expect(filter.status).to.equal(1);
  });
});
