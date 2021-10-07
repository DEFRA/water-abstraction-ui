'use strict';

const { set, find } = require('lodash');
const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();

const { expect } = require('@hapi/code');

const { getMainNav } = require('internal/lib/view/main-nav');
const { scope } = require('internal/lib/constants');

const getAuthenticatedRequest = () => {
  return {
    view: {
      activeNavLink: 'view'
    },
    state: {
      sid: '00000000-0000-0000-0000-000000000000'
    },
    auth: {
      credentials: {
        userId: 'user_1',
        scope: scope.internal
      }
    }
  };
};

const getARUserRequest = () => {
  const request = getAuthenticatedRequest(true);
  set(request, 'auth.credentials.scope', [scope.internal, scope.abstractionReformUser]);
  return request;
};

const getARApproverRequest = () => {
  const request = getARUserRequest(true);
  set(request, 'auth.credentials.scope', [scope.internal, scope.abstractionReformApprover, scope.billing]);
  return request;
};

const getReturnsRequest = () => {
  const request = getAuthenticatedRequest(true);
  set(request, 'auth.credentials.scope', [scope.internal, scope.returns]);
  return request;
};

const getBillingRequest = () => {
  const request = getAuthenticatedRequest(true);
  set(request, 'auth.credentials.scope', [scope.internal, scope.billing]);
  return request;
};

const getIds = links => links.map(link => link.id);

experiment('getMainNav', () => {
  test('It should not display any links if the user is not authenticated', async () => {
    const request = {};
    const links = getMainNav(request);
    expect(links.length).to.equal(0);
  });

  test('Non-active links should have the active flag set to false', async () => {
    const request = getARApproverRequest();
    const links = getMainNav(request);

    expect(find(links, { id: 'view' }).active).to.equal(true);
    expect(find(links, { id: 'bill-runs' }).active).to.equal(false);
    expect(find(links, { id: 'ar' }).active).to.equal(false);
    expect(find(links, { id: 'notifications' }).active).to.equal(false);
  });

  test('It should display correct links for internal user', async () => {
    const request = getAuthenticatedRequest(true);
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view']);
  });

  test('It should display correct links for AR user', async () => {
    const request = getARUserRequest();
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view', 'ar']);
  });

  test('It should display correct links for AR approver', async () => {
    const request = getARApproverRequest();
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view', 'bill-runs', 'ar', 'notifications']);
  });

  test('It should display correct links for Billing user', async () => {
    const request = getBillingRequest();
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view', 'bill-runs', 'notifications']);
  });

  test('It should display correct links for WIRS/returns user', async () => {
    const request = getReturnsRequest();
    const ids = getIds(getMainNav(request));
    expect(ids).to.equal(['view', 'notifications']);
  });
});
