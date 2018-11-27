'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');

const server = require('../../index');
const routePath = '/causeA404';

lab.experiment('Page does not exist', () => {
  lab.test('The page should 404', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(404);
  });
});
