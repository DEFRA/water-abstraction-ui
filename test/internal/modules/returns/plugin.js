'use strict';
const sinon = require('sinon');
const { expect } = require('code');
const Lab = require('lab');
const { set } = require('lodash');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();

const plugin = require('../../../../src/internal/modules/returns/plugin');
const waterConnector = require('../../../../src/internal/lib/connectors/water');
const crmConnector = require('../../../../src/internal/lib/connectors/crm');
const sessionHelpers = require('../../../../src/internal/modules/returns/lib/session-helpers');
const helpers = require('../../../../src/internal/modules/returns/lib/helpers');

const sandbox = sinon.createSandbox();

const returnId = 'return_1';
const licenceNumber = 'licence_1';
const companyId = 'company_1';

const createRequest = (isInternal, isLoadOption) => ({
  query: {
    returnId
  },
  auth: {
    credentials: {
      scope: isInternal ? ['internal', 'returns'] : ['external', 'primary_user']
    }
  },
  defra: {
    companyId
  },
  route: {
    settings: {
      plugins: {
        returns: isLoadOption ? { load: true } : true
      }
    }
  }
});

experiment('returns plugin', () => {
  let h;

  beforeEach(async () => {
    sandbox.stub(sessionHelpers, 'getSessionData').returns({ returnId });
    sandbox.stub(sessionHelpers, 'saveSessionData');
    sandbox.stub(waterConnector.returns, 'getReturn').resolves({
      returnId,
      licenceNumber
    });
    sandbox.stub(crmConnector.documents, 'findMany').resolves({
      error: null,
      data: [{ document_id: 'abc' }]
    });
    sandbox.stub(helpers, 'getViewData').resolves({ foo: 'bar' });
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub().returns({
        takeover: sandbox.stub()
      }),
      continue: 'continue'
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('for external users', () => {
    let request;

    experiment('when load config option is set', () => {
      beforeEach(async () => {
        request = createRequest(false, true);
      });

      test('loads document from CRM to check access', async () => {
        await plugin._handler(request, h);
        expect(crmConnector.documents.findMany.callCount).to.equal(1);

        const [ filter ] = crmConnector.documents.findMany.lastCall.args;
        expect(filter.company_entity_id).to.equal(companyId);
        expect(filter.system_external_id).to.equal(licenceNumber);
        expect(filter.regime_entity_id).to.be.a.string();
      });

      test('sets loaded view and return data in request', async () => {
        await plugin._handler(request, h);
        expect(request.returns.data).to.equal({ returnId });
        expect(request.returns.view).to.equal({ foo: 'bar' });
        expect(request.returns.isInternal).to.equal(false);
      });

      test('redirects if CRM document not found', async () => {
        crmConnector.documents.findMany.resolves({ data: [] });
        await plugin._handler(request, h);
        expect(h.redirect.callCount).to.equal(1);
        const [ path ] = h.redirect.lastCall.args;
        expect(path).to.equal('/returns/return?id=return_1');
      });

      test('throws error and redirects if no returns permission', async () => {
        set(request, 'auth.credentials.scope', ['external', 'user']);
        await plugin._handler(request, h);
        expect(h.redirect.callCount).to.equal(1);
        const [ path ] = h.redirect.lastCall.args;
        expect(path).to.equal('/returns/return?id=return_1');
      });
    });

    experiment('when load config option not set', () => {
      beforeEach(async () => {
        request = createRequest(false, false);
      });

      test('loads data from session', async () => {
        await plugin._handler(request, h);
        expect(crmConnector.documents.findMany.callCount).to.equal(0);
        expect(sessionHelpers.getSessionData.callCount).to.equal(1);
      });
    });
  });

  experiment('for internal users', () => {
    experiment('when load config option is set', () => {
      let request;

      beforeEach(async () => {
        request = createRequest(true, true);
      });

      test('does not check CRM', async () => {
        await plugin._handler(request, h);
        expect(crmConnector.documents.findMany.callCount).to.equal(0);
      });

      test('throws error and redirects if no returns permission', async () => {
        set(request, 'auth.credentials.scope', ['internal']);
        await plugin._handler(request, h);
        expect(h.redirect.callCount).to.equal(1);
        const [ path ] = h.redirect.lastCall.args;
        expect(path).to.equal('/returns/return?id=return_1');
      });
    });
  });
});
