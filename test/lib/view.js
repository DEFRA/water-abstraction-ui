'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const view = require('../../src/lib/view');

/*
 * Gets the minimal request object that allows the tests to run.
 */
const getBaseRequest = () => ({
  state: {},
  connection: {},
  sessionStore: {
    get: (key) => key
  },
  url: {},
  permissions: {
    admin: {},
    licences: {},
    returns: {}
  },
  auth: {
    credentials: {}
  },
  info: {}
});

experiment('lib/view.contextDefaults', () => {
  test('isAuthenticated is false when no sid in state', async () => {
    const request = getBaseRequest();
    const viewContext = view.contextDefaults(request);
    expect(viewContext.isAuthenticated).to.be.false();
  });

  test('isAuthenticated is true when the sid is in state', async () => {
    const request = getBaseRequest();
    request.state.sid = { sid: 'test-sid' };
    const viewContext = view.contextDefaults(request);
    expect(viewContext.isAuthenticated).to.be.true();
  });
});
