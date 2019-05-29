const Hapi = require('@hapi/hapi');

const plugin = require('../../../../../src/shared/lib/plugins/no-robots');

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

experiment('no robots plugin', () => {
  test('/robots.txt returns the expected response', async () => {
    const server = new Hapi.Server();
    server.register({ plugin });

    const response = await server.inject('/robots.txt');

    expect(response.payload).to.equal('User-agent: * Disallow: /');
    expect(response.statusCode).to.equal(200);
  });
});
