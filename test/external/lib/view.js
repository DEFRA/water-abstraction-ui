'use strict';
const { set } = require('lodash');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const view = require('../../../src/external/lib/view');
const { scope } = require('../../../src/external/lib/constants');

/*
 * Gets the minimal request object that allows the tests to run.
 */
const getBaseRequest = () => ({
  state: {},
  connection: {},
  yar: {
    get: (key) => key
  },
  url: {},
  auth: {
    credentials: {}
  },
  info: {}
});

experiment('lib/view.contextDefaults', () => {
  test('isAuthenticated is false when no userId in credentials', async () => {
    const request = getBaseRequest();
    const viewContext = view.contextDefaults(request);
    expect(viewContext.isAuthenticated).to.be.false();
  });

  test('isAuthenticated is true when the userId is in credentials', async () => {
    const request = getBaseRequest();
    set(request, 'auth.credentials.userId', 'user_123');
    const viewContext = view.contextDefaults(request);
    expect(viewContext.isAuthenticated).to.be.true();
  });

  test('surveyType is anonymous for a logged out user', async () => {
    const request = getBaseRequest();
    const viewContext = view.contextDefaults(request);
    expect(viewContext.surveyType).to.equal('anonymous');
  });

  test('surveyType is external for a logged in vml user', async () => {
    const request = getBaseRequest();
    set(request, 'auth.credentials.userId', 'user_123');
    set(request, 'auth.credentials.scope', [scope.external]);

    const viewContext = view.contextDefaults(request);
    expect(viewContext.surveyType).to.equal('external');
  });

  test('surveyType is internal for a logged in admin user', async () => {
    const request = getBaseRequest();
    set(request, 'auth.credentials.userId', 'user_123');
    set(request, 'auth.credentials.scope', [scope.internal]);

    const viewContext = view.contextDefaults(request);
    expect(viewContext.surveyType).to.equal('internal');
  });
});

experiment('lib/view.getTracking', () => {
  const existingUser = {
    lastLogin: '2018-10-24'
  };

  const newUser = {
    lastLogin: null
  };

  test('Should handle case where user is not logged in', async () => {
    const tracking = view.getTracking(null);
    expect(tracking.userType).to.equal('not_logged_in');
    expect(tracking.propertyId).to.exist();
    expect(tracking.debug).to.exist();
    expect(tracking.isLoggedIn).to.be.false();
  });

  test('Existing user', async () => {
    const tracking = view.getTracking(existingUser);
    expect(tracking.userType).to.equal('external');
    expect(tracking.lastLogin).to.equal('2018-10-24');
    expect(tracking.newUser).to.equal(false);
    expect(tracking.debug).to.exist();
    expect(tracking.propertyId).to.exist();
    expect(tracking.isLoggedIn).to.be.true();
  });

  test('New user', async () => {
    const tracking = view.getTracking(newUser);
    expect(tracking.userType).to.equal('external');
    expect(tracking.lastLogin).to.equal(null);
    expect(tracking.newUser).to.equal(true);
    expect(tracking.debug).to.exist();
    expect(tracking.propertyId).to.exist();
    expect(tracking.isLoggedIn).to.be.true();
  });
});
