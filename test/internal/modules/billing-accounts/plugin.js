'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const { omit } = require('lodash');
const uuid = require('uuid/v4');

const plugin = require('internal/modules/billing-accounts/plugin');
const session = require('internal/modules/billing-accounts/lib/session');

const createOptions = () => ({
  back: '/back/path',
  redirectPath: '/redirect/path',
  companyId: uuid(),
  regionId: uuid(),
  key: 'a-unique-key',
  caption: 'Caption',
  startDate: '2020-01-01',
  data: {}
});

const createUpdateOptions = () => ({
  isUpdate: true,
  ...omit(createOptions(), 'companyId', 'regionId', 'startDate'),
  data: {
    company: {
      id: uuid()
    }
  }
});

experiment('internal/modules/billing-accounts/plugin', () => {
  let server;

  beforeEach(async () => {
    sandbox.stub(session, 'set');
    sandbox.stub(session, 'get');
    server = {
      decorate: sandbox.stub(),
      route: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has a package name and version', async () => {
    expect(plugin.pkg.name).to.equal('billingAccountsPlugin');
    expect(plugin.pkg.version).to.equal('2.0.0');
    expect(plugin.pkg.dependencies).to.include([
      'addressEntryPlugin', 'accountEntryPlugin', 'contactEntryPlugin'
    ]);
  });

  test('has a register method', async () => {
    expect(plugin.register).to.be.a.function();
  });

  experiment('the plugin .register method', () => {
    beforeEach(async () => {
      await plugin.register(server);
    });

    test('the hapi request is decorated with the billingAccountEntryRedirect method', async () => {
      expect(server.decorate.calledWith(
        'request', 'billingAccountEntryRedirect', plugin._billingAccountEntryRedirect
      )).to.be.true();
    });

    test('the hapi request is decorated with the getBillingAccount method', async () => {
      expect(server.decorate.calledWith(
        'request', 'getBillingAccount', plugin._getBillingAccount
      )).to.be.true();
    });
  });

  experiment('.billingAccountEntryRedirect request method', () => {
    let options;

    experiment('for the billing account creation flow', () => {
      beforeEach(async () => {
        options = createOptions();
      });

      test('throws an error if the "back" option is omitted', async () => {
        delete options.back;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "redirectPath" option is omitted', async () => {
        delete options.redirectPath;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "companyId" option is omitted', async () => {
        delete options.companyId;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "regionId" option is omitted', async () => {
        delete options.regionId;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "key" option is omitted', async () => {
        delete options.key;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('"caption" option is optional', async () => {
        delete options.caption;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.not.throw();
      });

      test('throws an error if the "startDate" option is omitted', async () => {
        delete options.startDate;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('"data" option is optional', async () => {
        delete options.data;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.not.throw();
      });

      test('saves the supplied options to the session', async () => {
        const request = {};
        plugin._billingAccountEntryRedirect.call(request, options);
        expect(session.set.calledWith(
          request, options.key, options
        )).to.be.true();
      });

      test('returns a redirect path', async () => {
        const request = {};
        const path = plugin._billingAccountEntryRedirect.call(request, options);
        expect(path).to.equal(`/billing-account-entry/${options.key}`);
      });
    });

    experiment('for the update address flow', () => {
      beforeEach(async () => {
        options = createUpdateOptions();
      });

      test('throws an error if the "back" option is omitted', async () => {
        delete options.back;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "redirectPath" option is omitted', async () => {
        delete options.redirectPath;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "companyId" option is supplied', async () => {
        options.companyId = uuid();
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "regionId" option is supplied', async () => {
        options.regionId = uuid();
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "key" option is omitted', async () => {
        delete options.key;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('"caption" option is optional', async () => {
        delete options.caption;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.not.throw();
      });

      test('throws an error if the "startDate" option is supplied', async () => {
        options.startDate = '2021-01-01';
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('throws an error if the "data" option is omitted', async () => {
        delete options.data;
        const func = () => plugin._billingAccountEntryRedirect(options);
        expect(func).to.throw();
      });

      test('saves the supplied options to the session', async () => {
        const request = {};
        plugin._billingAccountEntryRedirect.call(request, options);
        expect(session.set.calledWith(
          request, options.key, {
            ...options,
            companyId: options.data.company.id
          }
        )).to.be.true();
      });

      test('returns a redirect path', async () => {
        const request = {};
        const path = plugin._billingAccountEntryRedirect.call(request, options);
        expect(path).to.equal(`/billing-account-entry/${options.key}/select-account`);
      });
    });
  });

  experiment('.getBillingAccount request method', () => {
    let result, request;
    const KEY = 'test-key';

    beforeEach(async () => {
      session.get.returns({
        data: {
          foo: 'bar'
        }
      });
      request = {};
      result = plugin._getBillingAccount.call(request, KEY);
    });

    test('calls session.get with the request and key', async () => {
      expect(session.get.calledWith(request, KEY)).to.be.true();
    });

    test('returns the .data object in the session', async () => {
      expect(result).to.equal({
        foo: 'bar'
      });
    });
  });
});
