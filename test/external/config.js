const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const config = require('external/config');

experiment('external/config', () => {
  experiment('hapiAuthCookie', () => {
    test('redirects to /welcome when not a google analytics cross domain request', async () => {
      const request = {
        query: {}
      };

      const redirectUrl = config.hapiAuthCookie.redirectTo(request);
      expect(redirectUrl).to.equal('/welcome');
    });

    test('redirects to /welcome with _ga query param when a google analytics cross domain request', async () => {
      const request = {
        query: {
          _ga: 'testing'
        }
      };

      const redirectUrl = config.hapiAuthCookie.redirectTo(request);
      expect(redirectUrl).to.equal('/welcome?_ga=testing');
    });

    test('redirects to /welcome but excludes other params', async () => {
      const request = {
        query: {
          not: 'forwarded'
        }
      };

      const redirectUrl = config.hapiAuthCookie.redirectTo(request);
      expect(redirectUrl).to.equal('/welcome');
    });
  });
});
