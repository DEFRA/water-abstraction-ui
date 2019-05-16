'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const server = require('../../../server-internal');
const routePath = '/signout';

lab.experiment('Check signout', () => {
  lab.test('The page should have links', async () => {
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
