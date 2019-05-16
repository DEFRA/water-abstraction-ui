'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const server = require('../../../server-internal');
const routePath = '/reset_password';

lab.experiment('Check signin', () => {
  lab.test('The page should return 200', async () => {
    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload: {}
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);
  });
});
