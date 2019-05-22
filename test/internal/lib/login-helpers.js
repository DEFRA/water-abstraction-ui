const sinon = require('sinon');
const { expect } = require('code');
const { logger } = require('../../../src/internal/logger');
const { experiment, test, afterEach, beforeEach } = exports.lab = require('lab').script();
const loginHelpers = require('../../../src/internal/lib/login-helpers');
const waterUser = require('../../../src/internal/lib/connectors/water-service/user');
const { scope } = require('../../../src/internal/lib/constants');

const sandbox = sinon.createSandbox();

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
  let h;

  const getRequest = (scope = []) => {
    return {
      path: '/request-path',
      auth: {
        credentials: {
          user_id: userId,
          scope
        }
      },
      cookieAuth: {
        set: sandbox.stub()
      },
      state: {
        sid: 'session_id'
      }
    };
  };

  beforeEach(async () => {
    sandbox.stub(waterUser, 'getUserStatus').resolves(responses.user);
    h = {
      redirect: sandbox.stub().returns({
        takeover: sandbox.stub()
      }),
      continue: 'continue'
    };
    sandbox.stub(logger, 'info');
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
      const request = getRequest(scope.internal);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/licences');
    });

    test('it should redirect to add licences if the user has no companies', async () => {
      const request = getRequest(scope.external);
      waterUser.getUserStatus.resolves(responses.userWithNoCompanies);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/add-licences');
    });

    test('it should redirect to view licences if the user has 1 company', async () => {
      const request = getRequest(scope.external);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/licences');
    });

    test('it should redirect to select company if the user has >1 company', async () => {
      const request = getRequest(scope.external);
      waterUser.getUserStatus.resolves(responses.userWithMultipleCompanies);
      const result = await loginHelpers.getLoginRedirectPath(request);
      expect(result).to.equal('/select-company');
    });
  });

  experiment('preRedirectIfAuthenticated', () => {
    test('returns h.continue if the request is not authenticated', async () => {
      const request = getRequest();
      delete request.state.sid;
      const result = await loginHelpers.preRedirectIfAuthenticated(request, h);
      expect(result).to.equal(h.continue);
    });

    test('returns h.redirect if request is authenticated', async () => {
      const request = getRequest(scope.external);
      await loginHelpers.preRedirectIfAuthenticated(request, h);
      const [ path ] = h.redirect.lastCall.args;
      expect(path).to.equal('/licences');
    });

    test('logs a message if a redirect has taken place', async () => {
      const request = getRequest(scope.external);
      await loginHelpers.preRedirectIfAuthenticated(request, h);
      const [ message, params ] = logger.info.lastCall.args;
      expect(message).to.be.a.string();
      expect(params.from).to.equal(request.path);
      expect(params.path).to.equal('/licences');
    });
  });
});
