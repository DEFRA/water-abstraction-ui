'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sessionForms = require('shared/lib/session-forms');

const sandbox = require('sinon').createSandbox();

const formA = {
  action: '/form/a',
  method: 'post'
};

const formB = {
  action: '/form/b',
  method: 'post'
};

const createRequest = (overrides = {}) => ({
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub(),
    clear: sandbox.stub()
  },
  ...overrides
});

experiment('modules/billing/lib/session-forms', () => {
  let request, result;

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.get', () => {
    experiment('when no form key is specified in the query params', () => {
      beforeEach(async () => {
        request = createRequest();
        result = sessionForms.get(request, formA);
      });

      test('does not clear the session cache', async () => {
        expect(request.yar.clear.called).to.be.false();
      });

      test('returns the default form', async () => {
        expect(result).to.equal(formA);
      });
    });

    experiment('when a form key is specified in the query params', () => {
      beforeEach(async () => {
        request = createRequest({
          query: {
            form: 'test-form-key'
          }
        });
      });

      experiment('and the form is found in the cache', async () => {
        beforeEach(async () => {
          request.yar.get.returns(formB);
          result = sessionForms.get(request, formA);
        });

        test('clears the session cache', async () => {
          expect(request.yar.clear.calledWith('test-form-key')).to.be.true();
        });

        test('returns the form from the session cache', async () => {
          expect(result).to.equal(formB);
        });
      });

      experiment('and the form is not found in the cache', async () => {
        beforeEach(async () => {
          request.yar.get.returns(undefined);
          result = sessionForms.get(request, formA);
        });

        test('does not clear the session cache', async () => {
          expect(request.yar.clear.called).to.be.false();
        });

        test('returns the default form', async () => {
          expect(result).to.equal(formA);
        });
      });
    });
  });

  experiment('.set', () => {
    let key;

    const form = {
      method: 'POST'
    };

    beforeEach(async () => {
      key = sessionForms.set(request, form);
    });

    test('the form is set in the session with a generated uuid key', async () => {
      expect(key).to.be.a.string().length(36);
      expect(request.yar.set.calledWith(
        key, form
      ));
    });
  });

  experiment('.plugin', () => {
    const { plugin } = sessionForms;

    test('has a package name and version', async () => {
      expect(plugin.pkg.name).to.equal('postRedirectGetPlugin');
      expect(plugin.pkg.version).to.equal('1.0.0');
    });

    test('has a register function', async () => {
      expect(plugin.register).to.be.a.function();
    });

    experiment('when the register function is called with the server', async () => {
      let server;

      beforeEach(async () => {
        server = {
          decorate: sandbox.stub()
        };
        plugin.register(server);
      });

      test('the hapi response toolkit is decorated', async () => {
        const [target, name, func] = server.decorate.lastCall.args;
        expect(target).to.equal('toolkit');
        expect(name).to.equal('postRedirectGet');
        expect(func).to.be.a.function();
      });
    });

    experiment('the postRedirectGet method that is registered', () => {
      let h;

      beforeEach(async () => {
        request = createRequest({
          query: {
            test: 123
          }
        });
        h = {
          request,
          redirect: sandbox.stub()
        };
      });

      experiment('when no custom path or params are supplied', () => {
        beforeEach(async () => {
          result = sessionForms._postRedirectGet.call(h, formA);
        });

        test('stores the form object in the session', async () => {
          const [key, value] = request.yar.set.lastCall.args;
          expect(key).to.be.a.string().length(36);
          expect(value).to.equal(formA);
        });

        test('redirects to the form path, including any query params in the request and the form session key', async () => {
          const [key] = request.yar.set.lastCall.args;
          const [path] = h.redirect.lastCall.args;
          expect(path).to.equal(`/form/a?test=123&form=${key}`);
        });
      });

      experiment('when a custom path is supplied', () => {
        beforeEach(async () => {
          result = sessionForms._postRedirectGet.call(h, formA, '/custom/path');
        });

        test('redirects to the custom path, including any query params in the request and the form session key', async () => {
          const [key] = request.yar.set.lastCall.args;
          const [path] = h.redirect.lastCall.args;
          expect(path).to.equal(`/custom/path?test=123&form=${key}`);
        });
      });

      experiment('when a custom path and params are supplied', () => {
        beforeEach(async () => {
          result = sessionForms._postRedirectGet.call(h, formA, '/custom/path', { foo: 'bar' });
        });

        test('redirects to the custom path and params and the form session key', async () => {
          const [key] = request.yar.set.lastCall.args;
          const [path] = h.redirect.lastCall.args;
          expect(path).to.equal(`/custom/path?foo=bar&form=${key}`);
        });
      });
    });
  });
});
