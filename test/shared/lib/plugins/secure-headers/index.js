const { expect } = require('@hapi/code');
const { beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();

const plugin = require('shared/plugins/secure-headers');

experiment('secure-headers', () => {
  let request;

  experiment('for web pages', () => {
    beforeEach(async () => {
      let method;
      const server = {
        ext: data => (method = data.method)
      };

      request = {
        path: '/some/path',
        response: {
          headers: {}
        }
      };

      const h = {
        continue: true
      };

      plugin.register(server, {});
      method(request, h);
    });

    test('adds X-Frame-Options header', async () => {
      expect(request.response.headers['X-Frame-Options']).to.equal('DENY');
    });

    test('adds X-Content-Type-Options header', async () => {
      expect(request.response.headers['X-Content-Type-Options']).to.equal('nosniff');
    });

    test('adds X-XSS-Protection header', async () => {
      expect(request.response.headers['X-XSS-Protection']).to.equal('1');
    });

    test('adds X-XSS-Protection header', async () => {
      expect(request.response.headers['Strict-Transport-Security']).to.equal('max-age=86400; includeSubDomains');
    });

    test('adds Referrer-Policy', async () => {
      expect(request.response.headers['Referrer-Policy']).to.equal('strict-origin-when-cross-origin');
    });

    test('add the Feature-Policy', async () => {
      const policy = request.response.headers['Feature-Policy'];
      expect(policy).to.contain('autoplay \'none\'');
      expect(policy).to.contain('geolocation \'self\'');
      expect(policy).to.contain('picture-in-picture \'none\'');
    });

    test('adds cache-control header', async () => {
      expect(request.response.headers['cache-control']).to.equal('no-cache, no-store, must-revalidate');
    });

    test('adds expires header', async () => {
      expect(request.response.headers['Expires']).to.equal(0);
    });

    test('adds pragma header', async () => {
      expect(request.response.headers['Pragma']).to.equal('no-cache');
    });
  });

  experiment('for static assets', () => {
    beforeEach(async () => {
      let method;
      const server = {
        ext: data => (method = data.method)
      };

      request = {
        path: '/some/path.css',
        response: {
          headers: {}
        }
      };

      const h = {
        continue: true
      };

      plugin.register(server, {});
      method(request, h);
    });

    test('adds X-Frame-Options header', async () => {
      expect(request.response.headers['X-Frame-Options']).to.equal('DENY');
    });

    test('adds X-Content-Type-Options header', async () => {
      expect(request.response.headers['X-Content-Type-Options']).to.equal('nosniff');
    });

    test('adds X-XSS-Protection header', async () => {
      expect(request.response.headers['X-XSS-Protection']).to.equal('1');
    });

    test('adds X-XSS-Protection header', async () => {
      expect(request.response.headers['Strict-Transport-Security']).to.equal('max-age=86400; includeSubDomains');
    });

    test('adds Referrer-Policy', async () => {
      expect(request.response.headers['Referrer-Policy']).to.equal('strict-origin-when-cross-origin');
    });

    test('add the Feature-Policy', async () => {
      const policy = request.response.headers['Feature-Policy'];
      expect(policy).to.contain('autoplay \'none\'');
      expect(policy).to.contain('geolocation \'self\'');
      expect(policy).to.contain('picture-in-picture \'none\'');
    });

    test('adds cache-control header', async () => {
      expect(request.response.headers['cache-control']).to.equal('public, max-age=3600');
    });

    test('adds expires header for 1 hour', async () => {
      expect(request.response.headers['Expires']).to.equal(3600);
    });

    test('does not add pragma header', async () => {
      expect(request.response.headers['Pragma']).to.be.undefined();
    });
  });
});
