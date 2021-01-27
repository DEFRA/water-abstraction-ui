'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const companyPreHandlers = require('shared/lib/pre-handlers/companies');
const session = require('internal/modules/contact-entry/lib/session');

const preHandlers = require('internal/modules/contact-entry/pre-handlers');

const h = sandbox.stub();
const COMPANY_ID = 'test-company-id';

experiment('src/internal/modules/contact-entry/pre-handlers', () => {
  let request, result;
  beforeEach(async () => {
    sandbox.stub(companyPreHandlers, 'loadCompany').resolves({ foo: 'bar' });
    sandbox.stub(companyPreHandlers, 'loadCompanyContacts').resolves({ bar: 'baz' });
    sandbox.stub(session, 'get').returns({ companyId: COMPANY_ID });

    request = {
      params: {
        key: 'test-key'
      }
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.getSessionData', () => {
    beforeEach(async () => {
      result = await preHandlers.getSessionData(request);
    });

    test('gets the session using the key param', () => {
      const [reqObj, key] = session.get.lastCall.args;
      expect(reqObj).to.equal(request);
      expect(key).to.equal(request.params.key);
    });

    test('returns the data from the session', () => {
      expect(result).to.equal({ companyId: COMPANY_ID });
    });

    test('returns a Boom not found error if no data is found', async () => {
      session.get.returns();
      result = await preHandlers.getSessionData(request);

      expect(result.isBoom).to.be.true();
      expect(result.message).to.equal(`Session data not found for ${request.params.key}`);
    });
  });

  experiment('.loadCompany', () => {
    beforeEach(async () => {
      result = await preHandlers.loadCompany(request, h);
    });

    test('gets the companyId from the session', () => {
      expect(session.get.called).to.be.true();
    });

    test('calls the shared pre-handler with expected params', () => {
      const [reqObj, toolkit, companyId] = companyPreHandlers.loadCompany.lastCall.args;
      expect(reqObj).to.equal(request);
      expect(toolkit).to.equal(h);
      expect(companyId).to.equal(COMPANY_ID);
    });

    test('returns the data from the shared pre-handler', () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.loadCompanyContacts', () => {
    beforeEach(async () => {
      result = await preHandlers.loadCompanyContacts(request, h);
    });

    test('gets the companyId from the session', () => {
      expect(session.get.called).to.be.true();
    });

    test('calls the shared pre-handler with expected params', () => {
      const [reqObj, toolkit, companyId] = companyPreHandlers.loadCompanyContacts.lastCall.args;
      expect(reqObj).to.equal(request);
      expect(toolkit).to.equal(h);
      expect(companyId).to.equal(COMPANY_ID);
    });

    test('returns the data from the shared pre-handler', () => {
      expect(result).to.equal({ bar: 'baz' });
    });
  });
});
