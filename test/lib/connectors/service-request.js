const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const http = require('../../../src/lib/connectors/http');
const serviceRequest = require('../../../src/lib/connectors/service-request');

const getExpectedOptions = (method, data) => {
  return {
    method,
    url: data.url,
    ...data.options,
    json: true,
    headers: {
      Authorization: data.token
    }
  };
};

experiment('serviceRequest', () => {
  const data = {
    url: 'url',
    originalJwtToken: process.env.JWT_TOKEN,
    options: {
      foo: 'bar',
      bar: 'foo'
    },
    token: 'token'
  };

  beforeEach(async () => {
    process.env.JWT_TOKEN = data.token;
    sandbox.stub(http, 'request');
  });

  afterEach(async () => {
    process.env.JWT_TOKEN = data.originalJwtToken;
    sandbox.restore();
  });

  test('get', async () => {
    serviceRequest.get(data.url, data.options);
    expect(http.request.lastCall.args[0]).to.equal(getExpectedOptions('GET', data));
  });

  test('post', async () => {
    serviceRequest.post(data.url, data.options);
    expect(http.request.lastCall.args[0]).to.equal(getExpectedOptions('POST', data));
  });

  test('patch', async () => {
    serviceRequest.patch(data.url, data.options);
    expect(http.request.lastCall.args[0]).to.equal(getExpectedOptions('PATCH', data));
  });
});
