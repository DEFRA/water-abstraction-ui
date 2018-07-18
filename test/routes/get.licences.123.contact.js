'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');
const DOMParser = require('xmldom').DOMParser;

const server = require('../../index');
const user = { username: process.env.test_username, entity_id: process.env.test_entity_id };

const guid = require('uuid/v1');
const routePath = `/licences/6e2118b7-fdce-49db-87f1-b2bade7bd8d0/contact`;
const invalidPath = '/licences/123/contact';
const notFoundPath = `/licences/${guid()}/contact`;

lab.experiment('Check single licence - contact page', () => {
  lab.test('The page should redirect if unauthorised', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    };

    // not logged in redirects
    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(302);
  });

  lab.test('The page should return 400 if licence number not GUID', async () => {
    const request = {
      method: 'GET',
      url: invalidPath,
      headers: {},
      payload: {},
      credentials: user
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(400);
  });

  // lab.test('The page should return 200 if valid licence', async () => {
  //
  //   const request = {
  //     method: 'GET',
  //     url: routePath,
  //     headers: {},
  //     payload: {},
  //     credentials : user
  //   }
  //   const res = await server.inject(request)
  //   Code.expect(res.statusCode).to.equal(200)
  //
  // })
  //
  // lab.test('The page should return 404 if licence not found for user', async () => {
  //
  //   const request = {
  //     method: 'GET',
  //     url: notFoundPath,
  //     headers: {},
  //     payload: {},
  //     credentials : user
  //   }
  //   const res = await server.inject(request)
  //   Code.expect(res.statusCode).to.equal(404)
  //
  // })
});
