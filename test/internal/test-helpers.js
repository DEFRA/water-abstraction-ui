'use strict';

const Hapi = require('@hapi/hapi');
const { cloneDeep, set } = require('lodash');

/**
 * Gets the smallest object that currently works as a test stub when
 * testing controller functions.
 *
 * It adds the most minimal content to meet the expectations of the
 * viewContextDefaults function in /src/internal/lib/view.js.
 */
const getMinimalRequest = () => ({
  labels: {},
  url: {},
  auth: {},
  view: {}
});

const getTestServer = route => {
  const server = Hapi.server();

  const testRoute = cloneDeep(route);
  testRoute.handler = (req, h) => h.response('Test handler').code(200);
  set(testRoute, 'options.auth', false);
  set(testRoute, 'options.pre', []);
  server.route(testRoute);
  return server;
};

exports.getMinimalRequest = getMinimalRequest;
exports.getTestServer = getTestServer;
