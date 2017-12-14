'use strict'

const Lab = require('lab')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const Code = require('code')
const DOMParser = require('xmldom').DOMParser
const server = require('../../index')
const routePath = '/signin'

// Used to stub IDM call
const IDM = require('../../src/lib/connectors/idm');
const CRM = require('../../src/lib/connectors/crm');

let sandbox;

lab.experiment('Check signin', () => {

  lab.beforeEach((cb) => {
    sandbox = sinon.sandbox.create();
    cb();
  })

  lab.afterEach((cb) => {
    sandbox.restore();
    cb();
  })

  lab.test('The page should log user in successfully', async () => {
    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload: {user_id: process.env.test_username, password: process.env.test_password}
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(200)

  })

  lab.test('The page should reject incorrect credentials', async () => {
    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload: {user_id: process.env.test_username, password: 'wrongpassword'}
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(401)

  })

  lab.test('The page should redirect user if reset required', async () => {

    // Stub the CRM getLicences method to throw an error
    const login = sandbox.stub(IDM, 'login');
    login.resolves({
      body : {
        reset_required : true,
        reset_guid : 'xyz'
      }
    });

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload: {user_id: process.env.test_username, password: process.env.test_password}
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302);

  })

  lab.test('The page should handle CRM getEntity error', async () => {

    // Stub the CRM getLicences method to throw an error
    const getEntity = sandbox.stub(CRM, 'getEntity');
    getEntity.resolves({ error : 'CRM error', data : null});

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload: {user_id: process.env.test_username, password: process.env.test_password}
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(500);

  })

  lab.test('The page should handle CRM entity not found', async () => {

    // Stub the CRM getLicences method to throw an error
    const getEntity = sandbox.stub(CRM, 'getEntity');
    getEntity.resolves({ error : null, data : {entity : {}}});

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload: {user_id: process.env.test_username, password: process.env.test_password}
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(500);

  })


})
