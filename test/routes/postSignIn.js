'use strict';

const Lab = require('lab');
const sinon = require('sinon');
const lab = exports.lab = Lab.script();
const Code = require('code');
const DOMParser = require('xmldom').DOMParser;
const server = require('../../index');
const routePath = '/signin';

// Used to stub IDM call
const IDM = require('../../src/lib/connectors/idm');
const CRM = require('../../src/lib/connectors/crm');

let sandbox;

lab.experiment('Check signin', () => {
  lab.beforeEach((cb) => {
    sandbox = sinon.sandbox.create();
    cb();
  });

  lab.afterEach((cb) => {
    sandbox.restore();
    cb();
  });

  // @TODO mock IDM call and add tests back
  // lab.test('The page should log user in successfully', async () => {
  //   const request = {
  //     method: 'POST',
  //     url: routePath,
  //     headers: {},
  //     payload: {user_id: process.env.test_username, password: process.env.test_password}
  //   };
  //
  //   const res = await server.inject(request);
  //   Code.expect(res.statusCode).to.equal(200);
  // });
  //
  // lab.test('The page should reject incorrect credentials', async () => {
  //   const request = {
  //     method: 'POST',
  //     url: routePath,
  //     headers: {},
  //     payload: {user_id: process.env.test_username, password: 'wrongpassword'}
  //   };
  //
  //   const res = await server.inject(request);
  //   Code.expect(res.statusCode).to.equal(401);
  // });
});
