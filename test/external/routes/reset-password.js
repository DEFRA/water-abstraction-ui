'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { createServer } = require('../server-factory');

const DOMParser = require('xmldom').DOMParser;

const routes = require('shared/plugins/reset-password/routes');

const getRoute = (path, method = 'GET') => {
  return routes.find(route =>
    route.path === path && route.method === method
  );
};

const getXmlDomFromResponse = response => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.payload, 'text/html');
  return doc;
};

experiment('reset password routes', () => {
  let server;

  beforeEach(async () => {
    server = await createServer();
  });

  experiment('/reset_password', () => {
    const url = '/reset_password';

    test('GET: The page should have a links', async () => {
      const method = 'GET';
      server.route(getRoute(url, method));

      const request = { method, url };

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.payload, 'text/html');

      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });

    test('POST: The page should have a links', async () => {
      const method = 'POST';
      server.route(getRoute(url, method));

      const request = { method, url, payload: {} };

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.payload, 'text/html');

      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });
  });

  experiment('/reset_password_check_email', () => {
    test('The page should have a links', async () => {
      const method = 'GET';
      const url = '/reset_password_check_email';
      server.route(getRoute(url, method));

      const request = { method, url };

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const doc = getXmlDomFromResponse(res);
      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });
  });

  experiment('/reset_password_resend_email', () => {
    test('GET: The page should have a links', async () => {
      const method = 'GET';
      const url = '/reset_password_resend_email';
      server.route(getRoute(url, method));

      const request = { method, url };

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const doc = getXmlDomFromResponse(res);
      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });

    test('POST: The page should have a links', async () => {
      const method = 'POST';
      const url = '/reset_password_resend_email';
      server.route(getRoute(url, method));

      const request = { method, url, payload: {} };

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const doc = getXmlDomFromResponse(res);
      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });
  });

  experiment('/reset_password_resent_email', () => {
    test('The page should have a links', async () => {
      const method = 'GET';
      const url = '/reset_password_resent_email';
      server.route(getRoute(url, method));

      const request = { method, url };

      const res = await server.inject(request);
      expect(res.statusCode).to.equal(200);

      const doc = getXmlDomFromResponse(res);
      const elements = doc.getElementsByTagName('a');
      expect(elements).to.exist();
    });
  });
});
