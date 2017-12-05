'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const DOMParser = require('xmldom').DOMParser
const sinon = require('sinon');

const server = require('../../index')
const user = { username : process.env.test_username, entity_id : process.env.test_entity_id };
const payload = { name : 'A new name'};

const guid = require('uuid/v1');
const routePath = `/licences/${ process.env.test_licence_id }`
const invalidPath = '/licences/123'
const notFoundPath = `/licences/${ guid() }`

const testHelpers = require('../helpers');

// Used to stub CRM call
const CRM = require('../../src/lib/connectors/crm');
let sandbox;

lab.experiment('Update licence name', () => {

  lab.beforeEach((cb) => {
    sandbox = sinon.sandbox.create();
    cb();
  })

  lab.afterEach((cb) => {
    sandbox.restore();
    cb();
  })

  lab.test('The page should redirect if unauthorised', async () => {
    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload
    }

    //not logged in redirects
    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302)
  })

  lab.test('The page should return 400 if licence number not GUID', async () => {
    const request = {
      method: 'POST',
      url: invalidPath,
      headers: {},
      payload,
      credentials : user
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(400)
  })

  lab.test('The page should return 302 redirect if updated successfully', async () => {

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload,
      credentials : user
    }
    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302)

  })

  lab.test('The page should return 404 if licence not found for user', async () => {

    const request = {
      method: 'POST',
      url: notFoundPath,
      headers: {},
      payload : {name : 'A new name'},
      credentials : user
    }
    const res = await server.inject(request)

    testHelpers.expect404Error(res);

  })

  lab.test('The page should update the licence if valid', async () => {

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload : {name : 'A new name'},
      credentials : user
    }
    const res = await server.inject(request)

    Code.expect(res.statusCode).to.equal(302)

  })

  lab.test('The page should not update the licence if invalid name supplied', async () => {

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload : {name : 'This name is far too long to display anywhere'},
      credentials : user
    }
    const res = await server.inject(request)

    Code.expect(res.statusCode).to.equal(200)

  })

  lab.test('The page should handle empty CRM response', async () => {

    // Stub the CRM getLicences method to throw an error
    const getLicences = sandbox.stub(CRM, 'getLicences');
    getLicences.resolves();

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload : {name : 'A new name'},
      credentials : user
    }
    const res = await server.inject(request)
    testHelpers.expect500Error(res);

  })


  lab.test('The page should handle CRM error', async () => {

    // Stub the CRM getLicences method to throw an error
    const getLicences = sandbox.stub(CRM, 'getLicences');
    getLicences.resolves({
      err : 'Some CRM error',
      data : []
    });

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload : {name : 'A new name'},
      credentials : user
    }
    const res = await server.inject(request)
    testHelpers.expect500Error(res);

  })

})
