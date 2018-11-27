'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');
const server = require('../../index');

const routePath = '/licences';
const sinon = require('sinon');
let sandbox;

lab.experiment('Check licences', () => {
  lab.beforeEach((cb) => {
    sandbox = sinon.sandbox.create();
    cb();
  });

  lab.afterEach((cb) => {
    sandbox.restore();
    cb();
  });

  lab.test('The page should redirect if unauthorised', async () => {
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
