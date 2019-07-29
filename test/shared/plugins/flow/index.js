const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const { set } = require('lodash');
const sandbox = require('sinon').createSandbox();
const plugin = require('shared/plugins/flow');
const forms = require('shared/lib/forms');

const createForm = (request, data = {}) => ({
  ...forms.formFactory(),
  fields: [
    forms.fields.text('name', { label: 'Name' }, data.name)
  ]
});

const model = {
  toObject: () => ({ name: 'Bob' })
};

experiment('shared flow plugin: ', () => {
  let server, adapter, h;

  beforeEach(async () => {
    server = {
      ext: sandbox.stub()
    };
    adapter = {
      get: sandbox.stub().resolves(model),
      set: sandbox.stub(),
      submit: sandbox.stub()
    };
    h = {
      continue: 'continue'
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('contains plugin details', async () => {
    expect(plugin.pkg).to.equal({
      name: 'flow',
      version: '1.0.0'
    });
  });

  test('register binds onPreHandler', async () => {
    await plugin.register(server);
    expect(server.ext.calledWith({
      type: 'onPreHandler',
      method: plugin._onPreHandler
    })).to.equal(true);
  });

  test('register binds onPostHandler', async () => {
    await plugin.register(server);
    expect(server.ext.calledWith({
      type: 'onPostHandler',
      method: plugin._onPostHandler
    })).to.equal(true);
  });

  experiment('when a route is not configured to use the plugin', () => {
    let request;
    beforeEach(async () => {
      request = {};
    });
    experiment('the onPreHandler', () => {
      test('returns h.continue', async () => {
        const result = await plugin._onPreHandler(request, h);
        expect(result).to.equal(h.continue);
      });
      test('does not modify the request', async () => {
        await plugin._onPreHandler(request, h);
        expect(request).to.equal({});
      });
    });
    experiment('the onPostHandler', () => {
      test('returns h.continue', async () => {
        const result = await plugin._onPostHandler(request, h);
        expect(result).to.equal(h.continue);
      });
      test('does not modify the request', async () => {
        await plugin._onPostHandler(request, h);
        expect(request).to.equal({});
      });
    });
  });

  experiment('when a route is configured to use the plugin', () => {
    let request;

    beforeEach(async () => {
      request = {
        path: '/test',
        route: {
          settings: {
            plugins: {
              flow: {
                adapter,
                form: createForm
              }
            }
          }
        }
      };
    });

    experiment('on GET routes', () => {
      beforeEach(async () => {
        request.method = 'get';
      });

      experiment('the onPreHandler', () => {
        test('calls the get method on the adapter', async () => {
          await plugin._onPreHandler(request, h);
          expect(adapter.get.calledWith(request)).to.equal(true);
        });

        test('adds a model instance object to the request', async () => {
          await plugin._onPreHandler(request, h);
          expect(request.model).to.equal(model);
        });

        test('adds a view.data object to the request', async () => {
          await plugin._onPreHandler(request, h);
          expect(request.view.data).to.equal(model.toObject());
        });

        test('adds a view.form object to the request', async () => {
          await plugin._onPreHandler(request, h);
          expect(request.view.form).to.be.an.object();
        });

        test('sets the form action to the current request path', async () => {
          await plugin._onPreHandler(request, h);
          expect(request.view.form.action).to.equal(request.path);
        });

        test('sets the form action to the current request path including query string', async () => {
          request.query = { foo: 'bar' };
          await plugin._onPreHandler(request, h);
          expect(request.view.form.action).to.equal(`${request.path}?foo=bar`);
        });

        test('returns h.continue', async () => {
          const result = await plugin._onPreHandler(request, h);
          expect(result).to.equal(h.continue);
        });
      });

      experiment('onPostHandler', () => {
        test('returns h.continue', async () => {
          const result = await plugin._onPostHandler(request, h);
          expect(result).to.equal(h.continue);
        });

        test('does not call adapter methods', async () => {
          await plugin._onPostHandler(request, h);
          expect(adapter.set.callCount).to.equal(0);
          expect(adapter.submit.callCount).to.equal(0);
        });
      });
    });

    experiment('on POST routes', async () => {
      beforeEach(async () => {
        request.method = 'post';
        request.payload = {
          name: 'Joe'
        };
      });

      experiment('the onPreHandler', () => {
        test('handles the form request', async () => {
          await plugin._onPreHandler(request, h);
          expect(request.view.form.isSubmitted).to.equal(true);
        });
      });

      experiment('the onPostHandler', () => {
        beforeEach(async () => {
          set(request, 'view.form.isValid', true);
          set(request, 'model', model);
        });

        test('stores the model using the adapter if the form is valid', async () => {
          await plugin._onPostHandler(request, h);
          expect(adapter.set.calledWith(request, model)).to.equal(true);
          expect(adapter.submit.callCount).to.equal(0);
        });

        test('submits the data using the adapter if configured as a submission route', async () => {
          set(request, 'route.settings.plugins.flow.submit', true);
          await plugin._onPostHandler(request, h);
          expect(adapter.submit.calledWith(request, model)).to.equal(true);
          expect(adapter.set.callCount).to.equal(0);
        });
      });
    });
  });
});
