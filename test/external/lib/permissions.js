'use strict';

const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

const permissions = require('external/lib/permissions');
const { scope } = require('external/lib/constants');

const createRequest = (scope) => ({
  state: {
    sid: '02e0994d-536a-4be5-8722-5ef9e7dfdcdd'
  },
  auth: {
    credentials: {
      userId: 'user_123',
      scope
    }
  }
});

experiment('permissions', () => {
  experiment('hasScope', () => {
    test('returns true if scope is in the credentials', async () => {
      const request = createRequest(['foo', 'bar']);
      expect(permissions.hasScope(request, 'foo')).to.equal(true);
    });

    test('returns true if scope is not in the credentials', async () => {
      const request = createRequest(['foo', 'bar']);
      expect(permissions.hasScope(request, 'baz')).to.equal(false);
    });
  });

  experiment('isAuthenticated', () => {
    test('returns true if a user ID is present', async () => {
      const request = createRequest();
      expect(permissions.isAuthenticated(request)).to.equal(true);
    });

    test('returns true if a user ID is absent', async () => {
      const request = createRequest();
      delete request.auth.credentials.userId;
      expect(permissions.isAuthenticated(request)).to.equal(false);
    });
  });

  experiment('isPrimaryUser', async () => {
    test('returns true if primary user in scope', async () => {
      const request = createRequest([scope.external, scope.licenceHolder]);
      expect(permissions.isPrimaryUser(request)).to.equal(true);
    });

    test('returns false if primary user not in scope', async () => {
      const request = createRequest([scope.external]);
      expect(permissions.isPrimaryUser(request)).to.equal(false);
    });
  });

  experiment('isReturnsUser', async () => {
    test('returns true if primary user in scope', async () => {
      const request = createRequest([scope.licenceHolder]);
      expect(permissions.isReturnsUser(request)).to.equal(true);
    });

    test('returns true if returns agent in scope', async () => {
      const request = createRequest([scope.colleagueWithReturns]);
      expect(permissions.isReturnsUser(request)).to.equal(true);
    });

    test('returns false otherwise', async () => {
      const request = createRequest([scope.external]);
      expect(permissions.isReturnsUser(request)).to.equal(false);
    });
  });
});
