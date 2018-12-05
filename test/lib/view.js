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
    returns: {},
    ar: {},
    hasPermission: () => {
      return false;
    }
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

  test('surveyType is anonymous for a logged out user', async () => {
    const request = getBaseRequest();
    const viewContext = view.contextDefaults(request);
    expect(viewContext.surveyType).to.equal('anonymous');
  });

  test('surveyType is external for a logged in vml user', async () => {
    const request = getBaseRequest();
    request.state.sid = { sid: 'test-sid' };
    request.permissions.admin.defra = false;

    const viewContext = view.contextDefaults(request);
    expect(viewContext.surveyType).to.equal('external');
  });

  test('surveyType is internal for a logged in admin user', async () => {
    const request = getBaseRequest();
    request.state.sid = { sid: 'test-sid' };
    request.permissions.admin.defra = true;

    const viewContext = view.contextDefaults(request);
    expect(viewContext.surveyType).to.equal('internal');
  });
});

experiment('lib/view.getTracking', () => {
  const internal = {
    scope: ['internal'],
    lastLogin: '2018-10-24'
  };

  const external = {
    scope: [],
    lastLogin: null
  };

  test('Should handle case where user is not logged in', async () => {
    const tracking = view.getTracking(null);
    expect(tracking.userType).to.equal('not_logged_in');
    expect(tracking.propertyId).to.exist();
    expect(tracking.debug).to.exist();
    expect(tracking.isLoggedIn).to.be.false();
  });

  test('Existing internal user', async () => {
    const tracking = view.getTracking(internal);
    expect(tracking.userType).to.equal('internal');
    expect(tracking.lastLogin).to.equal('2018-10-24');
    expect(tracking.newUser).to.equal(false);
    expect(tracking.debug).to.exist();
    expect(tracking.propertyId).to.exist();
    expect(tracking.isLoggedIn).to.be.true();
  });

  test('New external user', async () => {
    const tracking = view.getTracking(external);
    expect(tracking.userType).to.equal('external');
    expect(tracking.lastLogin).to.equal(null);
    expect(tracking.newUser).to.equal(true);
    expect(tracking.debug).to.exist();
    expect(tracking.propertyId).to.exist();
    expect(tracking.isLoggedIn).to.be.true();
  });
});
