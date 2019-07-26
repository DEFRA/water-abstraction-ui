'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const Code = require('@hapi/code');
const server = require('../../../server-external');

const routePath = '/licences';
const sinon = require('sinon');
let sandbox;

experiment('Check licences', () => {
  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('The page should redirect if unauthorised', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(302);
  });
});
