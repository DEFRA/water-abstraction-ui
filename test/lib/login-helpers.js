const sinon = require('sinon');
const { expect } = require('code');
const { set } = require('lodash');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const loginHelpers = require('../../src/lib/login-helpers');
const waterUser = require('../../src/lib/connectors/water-service/user');
const { scope } = require('../../src/lib/constants');

const userId = 'user_1';

const responses = {
  error: {
    error: 'oh no',
    data: null
  },
  user: {
    error: null,
    data: {
      companies: [{
        name: 'foo'
      }]
    }
  },
  userWithNoCompanies: {
    error: null,
    data: {
      companies: []
    }
  },
  userWithMultipleCompanies: {
    error: null,
    data: {
      companies: [{
        name: 'foo'
      }, {
        name: 'bar'
      }]
    }
  }
};

experiment('loginHelpers', () => {
  const sandbox = sinon.createSandbox();

  const getRequest = () => {
    return {
      auth: {
        credentials: {
          user_id: userId
        }
      },
      cookieAuth: {
        set: sandbox.stub()
      }
    };
  };

  beforeEach(async () => {
    sandbox.stub(waterUser, 'getUserStatus').resolves(responses.user);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('loadUserData', () => {
    test('it should load data from the water service user API', async () => {
      const result = await loginHelpers.loadUserData(userId);
      expect(result).to.equal(responses.user.data);
    });

    test('it should throw an error if API returns an error response', async () => {
      waterUser.getUserStatus.resolves(responses.error);
      const func = () => loginHelpers.loadUserData(userId);
      expect(func()).to.reject();
    });
  });

  experiment('selectCompany', () => {
    const company = {
      entityId: 'entity_1',
      name: 'company name'
    };

    test('it should set the company details in auth credentials', async () => {
      const request = getRequest();
      loginHelpers.selectCompany(request, company);

      expect(request.cookieAuth.set.firstCall.args[0]).to.equal('companyId');
      expect(request.cookieAuth.set.firstCall.args[1]).to.equal(company.entityId);
      expect(request.cookieAuth.set.secondCall.args[0]).to.equal('companyName');
      expect(request.cookieAuth.set.secondCall.args[1]).to.equal(company.name);
    });
  });

  experiment('getLoginRedirectPath', () => {
    beforeEach(async () => {
      sandbox.stub(loginHelpers, 'loadUserData').resolves(responses.user);
    });

    test('it should redirect to admin licences for internal users', async () => {
      const request = getRequest();
      set(request, 'auth.credentials.scope', scope.internal);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/admin/licences');
    });

    test('it should redirect to add licences if the user has no companies', async () => {
      const request = getRequest();
      set(request, 'auth.credentials.scope', scope.external);
      waterUser.getUserStatus.resolves(responses.userWithNoCompanies);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/add-licences');
    });

    test('it should redirect to view licences if the user has 1 company', async () => {
      const request = getRequest();
      set(request, 'auth.credentials.scope', scope.external);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/licences');
    });

    test('it should redirect to select company if the user has >1 company', async () => {
      const request = getRequest();
      set(request, 'auth.credentials.scope', scope.external);
      waterUser.getUserStatus.resolves(responses.userWithMultipleCompanies);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/select-company');
    });
  });
});
