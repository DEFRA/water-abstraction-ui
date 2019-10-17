const plugin = require('shared/plugins/returns');
const Lab = require('@hapi/lab');
const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const { set } = require('lodash');

const documentHeader = {
  licence_ref: '01/123',
  company_entity_id: 'company-1'
};

const createRequest = (pluginEnabled = true, includeCompany = false) => {
  const r = {};
  set(r, 'query.returnId', 'v1:8:01/123:2018-11-01:2019-10-31');
  set(r, 'route.settings.plugins.returns', pluginEnabled);
  if (includeCompany) {
    set(r, 'defra.companyId', 'company-1');
  }
  return r;
};

const createH = (checkAccess = true, includeExpired = false) => ({
  realm: {
    pluginOptions: {
      getDocumentHeader: sandbox.stub().resolves(documentHeader),
      checkAccess,
      includeExpired
    }
  },
  continue: 'continue'
});

experiment('returns plugin', () => {
  let server, h, request;
  beforeEach(async () => {
    server = {
      ext: sandbox.stub()
    };
  });
  afterEach(async () => {
    sandbox.restore();
  });

  test('includes package name and version', async () => {
    expect(plugin.pkg).to.equal({
      name: 'returnsPlugin',
      version: '2.0.0'
    });
  });

  test('has a register function', async () => {
    expect(plugin.register).to.be.a.function();
  });

  test('register function binds the onPreHandler', async () => {
    const options = {
      getDocumentHeader: () => {},
      checkAccess: true
    };
    plugin.register(server, options);
    expect(
      server.ext.calledWith({
        type: 'onPreHandler',
        method: plugin._handler
      })
    ).to.equal(true);
  });

  test('register function throws an error if invalid options are supplied', async () => {
    const options = {
      getDocumentHeader: 'x',
      checkAccess: true
    };
    const func = () => plugin.register(server, options);
    expect(func).to.throw();
  });

  experiment('when the plugin is disabled on a route', () => {
    beforeEach(async () => {
      request = createRequest(false);
      h = createH();
    });
    test('the document header is not loaded', async () => {
      await plugin._handler(request, h);
      expect(h.realm.pluginOptions.getDocumentHeader.callCount).to.equal(0);
    });
  });

  experiment('when the plugin is enabled and checkAccess disabled on a route', () => {
    beforeEach(async () => {
      request = createRequest(true, false);
      h = createH(false);
      await plugin._handler(request, h);
    });

    test('the document header is loaded', async () => {
      expect(
        h.realm.pluginOptions.getDocumentHeader.calledWith('01/123', false)
      ).to.equal(true);
    });

    test('the document header is attached to request.view', async () => {
      expect(request.view.documentHeader).to.equal(documentHeader);
    });

    test('a 404 error is thrown if the document header is not found', async () => {
      try {
        h.realm.pluginOptions.getDocumentHeader.resolves(null);
        await plugin._handler(request, h);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(404);
      }
    });

    test('expired licences can be configured to be included', async () => {
      request = createRequest(true, false);
      h = createH(false, true);
      await plugin._handler(request, h);

      const [licenceRef, includeExpired] = h.realm.pluginOptions.getDocumentHeader.lastCall.args;
      expect(licenceRef).to.equal('01/123');
      expect(includeExpired).to.be.true();
    });
  });

  experiment('when the plugin is enabled and checkAccess enabled on a route', () => {
    beforeEach(async () => {
      h = createH(true);
    });

    test('if company ID matches, no error is thrown', async () => {
      request = createRequest(true, true);
      const result = await plugin._handler(request, h);
      expect(result).to.equal(h.continue);
    });

    test('if user has no company, an error is thrown', async () => {
      request = createRequest(true, false);
      const func = () => plugin._handler(request, h);
      expect(func()).to.reject();
    });

    test('if user has different company, an error is thrown', async () => {
      request = createRequest(true, true);
      request.defra.companyId = 'different-company';
      const func = () => plugin._handler(request, h);
      expect(func()).to.reject();
    });

    test('if licence has no company, an error is thrown', async () => {
      request = createRequest(true, true);
      h.realm.pluginOptions.getDocumentHeader.resolves({
        licence_ref: '01/123',
        company_entity_id: null
      });
      const func = () => plugin._handler(request, h);
      expect(func()).to.reject();
    });
  });
});
