'use strict';

const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

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
    test('it should return true if scope is in the credentials', async () => {
      const request = createRequest(['foo', 'bar']);
      expect(permissions.hasScope(request, 'foo')).to.equal(true);
    });

    test('it should return true if scope is not in the credentials', async () => {
      const request = createRequest(['foo', 'bar']);
      expect(permissions.hasScope(request, 'baz')).to.equal(false);
    });
  });

  experiment('isAuthenticated', () => {
    test('it should return true if a user ID is present', async () => {
      const request = createRequest();
      expect(permissions.isAuthenticated(request)).to.equal(true);
    });

    test('it should return true if a user ID is absent', async () => {
      const request = createRequest();
      delete request.auth.credentials.userId;
      expect(permissions.isAuthenticated(request)).to.equal(false);
    });
  });

  experiment('isInternal', async () => {
    test('it should return true if internal in scope', async () => {
      const request = createRequest([scope.internal]);
      expect(permissions.isInternal(request)).to.equal(true);
    });

    test('it should return false if internal not in scope', async () => {
      const request = createRequest([scope.external]);
      expect(permissions.isInternal(request)).to.equal(false);
    });
  });

  experiment('isExternal', async () => {
    test('it should return true if external in scope', async () => {
      const request = createRequest([scope.external]);
      expect(permissions.isExternal(request)).to.equal(true);
    });

    test('it should return false if external not in scope', async () => {
      const request = createRequest([scope.internal]);
      expect(permissions.isExternal(request)).to.equal(false);
    });
  });

  experiment('isPrimaryUser', async () => {
    test('it should return true if primary user in scope', async () => {
      const request = createRequest([scope.external, scope.licenceHolder]);
      expect(permissions.isPrimaryUser(request)).to.equal(true);
    });

    test('it should return false if primary user not in scope', async () => {
      const request = createRequest([scope.external]);
      expect(permissions.isPrimaryUser(request)).to.equal(false);
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

  experiment('isExternalReturns', async () => {
    test('it should return true if primary user in scope', async () => {
      const request = createRequest([scope.licenceHolder]);
      expect(permissions.isExternalReturns(request)).to.equal(true);
    });

    test('it should return true if returns agent in scope', async () => {
      const request = createRequest([scope.colleagueWithReturns]);
      expect(permissions.isExternalReturns(request)).to.equal(true);
    });

    test('it should return false otherwise', async () => {
      const request = createRequest([scope.external]);
      expect(permissions.isExternalReturns(request)).to.equal(false);
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
});
