'use strict';
const sinon = require('sinon');
const { expect } = require('code');
const Lab = require('lab');
const { set } = require('lodash');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();

const plugin = require('internal/modules/returns/plugin');
const waterConnector = require('internal/lib/connectors/water');
const services = require('internal/lib/connectors/services');
const sessionHelpers = require('internal/modules/returns/lib/session-helpers');
const helpers = require('internal/modules/returns/lib/helpers');

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
    sandbox.stub(services.crm.documents, 'findMany').resolves({
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

  experiment('for internal users', () => {
    experiment('when load config option is set', () => {
      let request;

      beforeEach(async () => {
        request = createRequest(true, true);
      });

      test('does not check CRM', async () => {
        await plugin._handler(request, h);
        expect(services.crm.documents.findMany.callCount).to.equal(0);
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
