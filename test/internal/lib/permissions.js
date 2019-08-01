'use strict';

const Lab = require('@hapi/lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

const permissions = require('internal/lib/permissions');
const { scope } = require('internal/lib/constants');

const createRequest = (scope) => ({
  state: {
    sid: '02e0994d-536a-4be5-8722-5ef9e7dfdcdd'
  },
  auth: {
    credentials: {
      userId: 'test-user',
      scope
    }
  }
});

experiment('permissions', () => {
  experiment('hasScope', () => {
    experiment('when the supplied scope is a string', () => {
      test('it should return true if scope is in the credentials', async () => {
        const request = createRequest(['foo', 'bar']);
        expect(permissions.hasScope(request, 'foo')).to.equal(true);
      });

      test('it should return true if scope is not in the credentials', async () => {
        const request = createRequest(['foo', 'bar']);
        expect(permissions.hasScope(request, 'baz')).to.equal(false);
      });
    });

    experiment('when the supplied scope is an array', () => {
      test('it should return false if provided array is empty', async () => {
        const request = createRequest(['foo', 'bar']);
        expect(permissions.hasScope(request, [])).to.equal(false);
      });

      test('it should return true if scope is in the credentials', async () => {
        const request = createRequest(['foo', 'bar']);
        expect(permissions.hasScope(request, ['baz', 'foo'])).to.equal(true);
      });

      test('it should return true if scope is not in the credentials', async () => {
        const request = createRequest(['foo', 'bar']);
        expect(permissions.hasScope(request, ['baz'])).to.equal(false);
      });
    });
  });

  experiment('isAuthenticated', () => {
    test('it should return true if a user ID is present', async () => {
      const request = createRequest();
      expect(permissions.isAuthenticated(request)).to.equal(true);
    });

    test('it should return false if a user ID is absent', async () => {
      const request = createRequest();
      delete request.auth.credentials.userId;
      expect(permissions.isAuthenticated(request)).to.equal(false);
    });
  });

  experiment('isInternalReturns', async () => {
    test('it should return true if internal returns in scope', async () => {
      const request = createRequest([scope.internal, scope.returns]);
      expect(permissions.isInternalReturns(request)).to.equal(true);
    });

    test('it should return false if internal returns not in scope', async () => {
      const request = createRequest([scope.internal]);
      expect(permissions.isInternalReturns(request)).to.equal(false);
    });
  });

  experiment('isARUser', async () => {
    test('it should return true if AR user in scope', async () => {
      const request = createRequest([scope.abstractionReformUser]);
      expect(permissions.isARUser(request)).to.equal(true);
    });

    test('it should return false if AR user not in scope', async () => {
      const request = createRequest([scope.abstractionReformApprover]);
      expect(permissions.isARUser(request)).to.equal(false);
    });
  });

  experiment('isARApprover', async () => {
    test('it should return true if AR approver in scope', async () => {
      const request = createRequest([scope.abstractionReformApprover]);
      expect(permissions.isARApprover(request)).to.equal(true);
    });

    test('it should return false if AR approver not in scope', async () => {
      const request = createRequest([scope.abstractionReformUser]);
      expect(permissions.isARApprover(request)).to.equal(false);
    });
  });

  experiment('isAnyAR', async () => {
    test('it should return true if AR user in scope', async () => {
      const request = createRequest([scope.abstractionReformUser]);
      expect(permissions.isAnyAR(request)).to.equal(true);
    });

    test('it should return true if AR approver in scope', async () => {
      const request = createRequest([scope.abstractionReformApprover]);
      expect(permissions.isAnyAR(request)).to.equal(true);
    });

    test('it should return false otherwise', async () => {
      const request = createRequest([scope.internal]);
      expect(permissions.isAnyAR(request)).to.equal(false);
    });
  });

  experiment('isBulkReturnNotifications', async () => {
    test('it should return true if bulk returns notifications in scope', async () => {
      const request = createRequest([scope.bulkReturnNotifications]);
      expect(permissions.isBulkReturnNotifications(request)).to.equal(true);
    });

    test('it should return false if bulk returns notifications not in scope', async () => {
      const request = createRequest([]);
      expect(permissions.isBulkReturnNotifications(request)).to.equal(false);
    });
  });

  experiment('isHofOrRenewalNotifications', async () => {
    test('it should return true if HoF notifications in scope', async () => {
      const request = createRequest([scope.hofNotifications]);
      expect(permissions.isHofOrRenewalNotifications(request)).to.equal(true);
    });

    test('it should return true if renewal notifications in scope', async () => {
      const request = createRequest([scope.renewalNotifications]);
      expect(permissions.isHofOrRenewalNotifications(request)).to.equal(true);
    });

    test('it should return true if HoF and renewal notifications in scope', async () => {
      const request = createRequest([scope.renewalNotifications, scope.hofNotifications]);
      expect(permissions.isHofOrRenewalNotifications(request)).to.equal(true);
    });

    test('it should return false if scope does not match', async () => {
      const request = createRequest(['scope-1', 'scope-2']);
      expect(permissions.isHofOrRenewalNotifications(request)).to.equal(false);
    });

    test('it should return false if no scopes', async () => {
      const request = createRequest([]);
      expect(permissions.isHofOrRenewalNotifications(request)).to.equal(false);
    });
  });

  experiment('isAnyNotifications', async () => {
    test('it should return true if HoF notifications in scope', async () => {
      const request = createRequest([scope.hofNotifications]);
      expect(permissions.isAnyNotifications(request)).to.equal(true);
    });

    test('it should return true if renewal notifications in scope', async () => {
      const request = createRequest([scope.renewalNotifications]);
      expect(permissions.isAnyNotifications(request)).to.equal(true);
    });

    test('it should return true if returns in scope', async () => {
      const request = createRequest([scope.returns]);
      expect(permissions.isAnyNotifications(request)).to.equal(true);
    });

    test('it should return true if bulk returns notifications in scope', async () => {
      const request = createRequest([scope.bulkReturnNotifications]);
      expect(permissions.isAnyNotifications(request)).to.equal(true);
    });

    test('it should return true if several notifications in scope', async () => {
      const request = createRequest([scope.returns, scope.bulkReturnNotifications]);
      expect(permissions.isAnyNotifications(request)).to.equal(true);
    });

    test('it should return false if scope does not match', async () => {
      const request = createRequest(['scope-1', 'scope-2']);
      expect(permissions.isAnyNotifications(request)).to.equal(false);
    });

    test('it should return false if no scopes', async () => {
      const request = createRequest([]);
      expect(permissions.isAnyNotifications(request)).to.equal(false);
    });
  });

  experiment('isBasicUser', async () => {
    test('it should return true if scopes empty', async () => {
      const request = createRequest([]);
      expect(permissions.isBasicUser(request)).to.equal(true);
    });

    test('it should return false if scopes not empty', async () => {
      const request = createRequest(['a', 'b']);
      expect(permissions.isBasicUser(request)).to.equal(false);
    });
  });

  experiment('isManageTab', async () => {
    test('it should return true if internal returns scope', async () => {
      const request = createRequest([scope.returns]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if bulk returns scope', async () => {
      const request = createRequest([scope.bulkReturnNotifications]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if digitise! approver scope', async () => {
      const request = createRequest([scope.abstractionReformApprover]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if HoF notifications scope', async () => {
      const request = createRequest([scope.hofNotifications]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if renewal reminder scope', async () => {
      const request = createRequest([scope.renewalNotifications]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if renewal reminder scope', async () => {
      const request = createRequest([scope.manageAccounts]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if several matching scopes', async () => {
      const request = createRequest([scope.manageAccounts, scope.renewalNotifications]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return true if matching and non-matching scopes', async () => {
      const request = createRequest(['scope-x', scope.renewalNotifications]);
      expect(permissions.isManageTab(request)).to.equal(true);
    });

    test('it should return false if no scopes that should see the manage tab', async () => {
      const request = createRequest(['scope-x', 'scope-y']);
      expect(permissions.isManageTab(request)).to.equal(false);
    });

    test('it should return false if no scopes', async () => {
      const request = createRequest([]);
      expect(permissions.isManageTab(request)).to.equal(false);
    });
  });
});
