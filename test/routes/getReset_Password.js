'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Code = require('code');
const DOMParser = require('xmldom').DOMParser;

const server = require('../../index');
const routePath = '/reset_password';

lab.experiment('Check signin', () => {
  lab.test('The page should have a links', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    const parser = new DOMParser();
    const doc = parser.parseFromString(res.payload, 'text/html');

    const elements = doc.getElementsByTagName('a');
    Code.expect(elements).to.exist();
  });
});
