'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const server = require('../../index')

const DOMParser = require('xmldom').DOMParser
const routePath = '/licences'

const user = { username : process.env.test_username, entity_id : process.env.test_entity_id };

// Used to stub CRM call
const sinon = require('sinon');
const CRM = require('../../src/lib/connectors/crm');
let sandbox;

lab.experiment('Check licences', () => {

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
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    }

    //mnot logged in redirects

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302)

  })

  lab.test('The page should show licences if authorised', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {},
      credentials : user
    }

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200)

  })

  lab.test('The page should allow filtering of licences by user email address', async () => {
    const request = {
      method: 'GET',
      url: `${ routePath }?emailAddress=${ user.username }`,
      headers: {},
      payload: {},
      credentials : user
    }

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200)

  })

  lab.test('The page should allow filtering of licences by licence number', async () => {
    const request = {
      method: 'GET',
      url: `${ routePath }?licenceNumber=001`,
      headers: {},
      payload: {},
      credentials : user
    }

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200)

  })

    lab.test('The page should allow filtering of licences by licence number and user email', async () => {
      const request = {
        method: 'GET',
        url: `${ routePath }?licenceNumber=001&emailAddress=${ user.username }`,
        headers: {},
        payload: {},
        credentials : user
      }

      const res = await server.inject(request);
      Code.expect(res.statusCode).to.equal(200)

    })

    lab.test('The page should allow filtering and sorting', async () => {
      const request = {
        method: 'GET',
        url: `${ routePath }?licenceNumber=001&emailAddress=${ user.username }&sort=licenceNumber&direction=-1`,
        headers: {},
        payload: {},
        credentials : user
      }

      const res = await server.inject(request);
      Code.expect(res.statusCode).to.equal(200)

    })

    lab.test('The page should handle CRM error', async () => {

      // Stub the CRM getLicences method to throw an error
      const getLicences = sandbox.stub(CRM, 'getLicences');
      getLicences.throws(new Error('CRM error'));

      const request = {
        method: 'GET',
        url: `${ routePath }?licenceNumber=001&emailAddress=${ user.username }&sort=licenceNumber&direction=-1`,
        headers: {},
        payload: {},
        credentials : user
      }

      const res = await server.inject(request);

      Code.expect(res.statusCode).to.equal(500);

    })





})
