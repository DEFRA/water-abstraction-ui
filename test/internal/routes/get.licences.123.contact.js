'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const server = require('../../../server-internal');

const routePath = `/licences/6e2118b7-fdce-49db-87f1-b2bade7bd8d0/contact`;

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
});
