'use strict';

const { expect } = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const helpers = require('../../../src/modules/returns/lib/helpers');

lab.experiment('isInternalReturnsUser', () => {
  lab.test('returns false if the user does not have returns permission', async () => {
    const request = {
      permissions: {
        returns: {
          read: false
        }
      }
    };

    const isInternalReturnsUser = helpers.isInternalReturnsUser(request);
    expect(isInternalReturnsUser).to.be.false();
  });

  lab.test('there is a result for the user with returns', async () => {
    const request = {
      permissions: {
        returns: {
          read: true
        }
      }
    };

    const isInternalReturnsUser = helpers.isInternalReturnsUser(request);
    expect(isInternalReturnsUser).to.be.true();
  });
});

lab.experiment('getInternalRoles', () => {
  lab.test('returns the original roles if the user is an internal user', async () => {
    const isInternalUser = true;
    const roles = helpers.getInternalRoles(isInternalUser, ['test_role']);
    expect(roles).to.only.include('test_role');
  });

  lab.test('returns replaces the original roles with the expected roles if the user is an external user', async () => {
    const isInternalUser = false;
    const roles = helpers.getInternalRoles(isInternalUser, ['test_role']);
    expect(roles).to.only.include(['primary_user', 'user_returns']);
  });
});
