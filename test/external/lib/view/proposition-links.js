'use strict';

const { find } = require('lodash');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const { getPropositionLinks } = require('external/lib/view/proposition-links');
const { scope } = require('external/lib/constants');

const getAuthenticatedRequest = () => {
  return {
    view: {
      activeNavLink: 'account-settings'
    },
    state: {
      sid: '00000000-0000-0000-0000-000000000000'
    },
    auth: {
      credentials: {
        userId: 'user_123',
        scope: scope.external
      }
    }
  };
};

experiment('getPropositionLinks', () => {
  test('It should not display any links if the user is not authenticated', async () => {
    const request = {};
    const result = getPropositionLinks(request);
    expect(result.length).to.equal(0);
  });

  test('displays account settings and signout links for all authenticated users', async () => {
    const request = getAuthenticatedRequest();
    const links = getPropositionLinks(request);
    const ids = links.map(link => link.id);
    expect(ids).to.equal(['account-settings', 'signout']);
  });

  test('sets the active nav link flag', async () => {
    const request = getAuthenticatedRequest();
    const links = getPropositionLinks(request);
    const link = find(links, { id: 'account-settings' });
    expect(link.active).to.equal(true);
  });

  test('Non-active links should have the active flag set to false', async () => {
    const request = getAuthenticatedRequest();
    const links = getPropositionLinks(request);
    const flags = links.filter(link => (link.id !== 'account-settings')).map(link => link.active);
    expect(flags).to.equal([false]);
  });

  test('It should set ID attributes', async () => {
    const request = getAuthenticatedRequest();
    const links = getPropositionLinks(request);
    const idAttributes = links.map(link => link.attributes.id);
    expect(idAttributes).to.equal(['account-settings', 'signout']);
  });
});
