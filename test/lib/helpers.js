'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Code = require('code');

const helpers = require('../../src/lib/helpers.js');

lab.experiment('helpers.makeURIRequest', () => {
  lab.test('function exists', async () => {
    Code.expect(helpers.makeURIRequest).to.be.a.function();
  });
});

lab.experiment('helpers.makeURIRequestWithBody', () => {
  lab.test('function exists', async () => {
    Code.expect(helpers.makeURIRequestWithBody).to.be.a.function();
  });
});
