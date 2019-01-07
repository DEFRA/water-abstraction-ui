'use strict';

const { find } = require('lodash');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const { getPropositionLinks } = require('../../../src/lib/view/proposition-links.js');

const getAuthenticatedRequest = (isInternal = false) => {
  return {
    view: {
      activeNavLink: 'change-password'
    },
    state: {
      sid: '00000000-0000-0000-0000-000000000000'
    },
    permissions: {
      admin: {
        defra: isInternal
      }
    }
  };
};

lab.experiment('getPropositionLinks', () => {
  lab.test('It should not display any links if the user is not authenticated', async () => {
    const request = {};
    const result = getPropositionLinks(request);
    expect(result.length).to.equal(0);
  });

  lab.test('It should display change password and signout links for all authenticated users', async () => {
    const request = getAuthenticatedRequest(false);
    const links = getPropositionLinks(request);
    const ids = links.map(link => link.id);
    expect(ids).to.equal(['change-password', 'signout']);
  });

  lab.test('It should display contact details, change password, signout links for internal users', async () => {
    const request = getAuthenticatedRequest(true);
    const links = getPropositionLinks(request);
    const ids = links.map(link => link.id);
    expect(ids).to.equal(['contact-information', 'change-password', 'signout']);
  });

  lab.test('It should set the active nav link flag', async () => {
    const request = getAuthenticatedRequest(true);
    const links = getPropositionLinks(request);
    const link = find(links, { id: 'change-password' });
    expect(link.active).to.equal(true);
  });

  lab.test('Non-active links should have the active flag set to false', async () => {
    const request = getAuthenticatedRequest();
    const links = getPropositionLinks(request);
    const flags = links.filter(link => (link.id !== 'change-password')).map(link => link.active);
    expect(flags).to.equal([false]);
  });

  lab.test('It should set ID attributes', async () => {
    const request = getAuthenticatedRequest(true);
    const links = getPropositionLinks(request);
    const idAttributes = links.map(link => link.attributes.id);
    expect(idAttributes).to.equal(['contact-information', 'change-password', 'signout']);
  });
});
