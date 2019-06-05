'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');
const server = require('../../../server-external');
const routePath = '/update_password';

lab.experiment('Check signin', () => {
  lab.test('The page should have a links', async () => {
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
