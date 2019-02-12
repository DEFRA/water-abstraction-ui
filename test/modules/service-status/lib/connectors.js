'use strict';
const Lab = require('lab');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const connectors = require('../../../../src/modules/service-status/lib/connectors');
const IDM = require('../../../../src/lib/connectors/idm');
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

experiment('getIDMUserCount', () => {
  beforeEach(async () => {
    sinon.stub(IDM.usersClient, 'findMany').resolves({
      pagination: {
        totalRows: 6
      }
    });
  });

  afterEach(async () => {
    IDM.usersClient.findMany.restore();
  });

  test('IDM user count calls correct API', async () => {
    const result = await connectors.getIDMUserCount();
    expect(result).to.equal(6);
  });
});
