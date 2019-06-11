'use strict';

const { find, set } = require('lodash');
const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();

const { expect } = require('code');

const { getMainNav } = require('../../../../src/external/lib/view/main-nav');
const { scope } = require('../../../../src/external/lib/constants');

const getAuthenticatedRequest = (isInternal = false) => {
  return {
    view: {
      activeNavLink: 'view'
    },
    state: {
      sid: '00000000-0000-0000-0000-000000000000'
    },
    auth: {
      credentials: {
        userId: 'user_123',
        scope: [isInternal ? scope.internal : scope.external]
      }
    }
  };
};

const getPrimaryUserRequest = () => {
  const request = getAuthenticatedRequest();
  set(request, 'auth.credentials.scope', [scope.external, scope.licenceHolder]);
  return request;
};

const getIds = links => links.map(link => link.id);

experiment('getMainNav', () => {
  test('It should not display any links if the user is not authenticated', async () => {
    const request = {};
    const links = getMainNav(request);
    expect(links.length).to.equal(0);
  });

  test('It should set the active nav link flag', async () => {
    const request = getPrimaryUserRequest();
    const links = getMainNav(request);
    const link = find(links, { id: 'view' });
    expect(link.active).to.equal(true);
  });

  test('Non-active links should have the active flag set to false', async () => {
    const request = getPrimaryUserRequest();
    const links = getMainNav(request);
    const flags = links.filter(link => (link.id !== 'view')).map(link => link.active);
    expect(flags).to.equal([false, false]);
  });

  test('It should display correct links for external user', async () => {
    const request = getAuthenticatedRequest();
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view']);
  });

  test('It should display correct links for external primary', async () => {
    const request = getPrimaryUserRequest();
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view', 'returns', 'manage']);
  });

  test('for a request with licence.userLicenceCount of 0, only view is added', async () => {
    const request = getPrimaryUserRequest();
    request.licence = { userLicenceCount: 0 };
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view']);
  });

  test('for a request with licence.userLicenceCount of 1, all tabs are added', async () => {
    const request = getPrimaryUserRequest();
    request.licence = { userLicenceCount: 1 };
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view', 'returns', 'manage']);
  });
});
