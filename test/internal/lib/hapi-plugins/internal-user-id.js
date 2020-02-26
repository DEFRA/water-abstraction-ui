'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { http } = require('@envage/water-abstraction-helpers');
const plugin = require('../../../../src/internal/lib/hapi-plugins/internal-user-id');

experiment('internal/lib/hapi-plugins/internal-user-id', () => {
  let onPreHandler;
  let onPostHandler;
  let h;

  beforeEach(async () => {
    sandbox.stub(http, 'onPreRequest');
    sandbox.stub(http, 'removePreRequestListener');

    h = {
      continue: Symbol('continue')
    };

    const server = {
      ext: sandbox.spy()
    };

    await plugin.register(server);

    onPreHandler = server.ext.firstCall.args[0].method;
    onPostHandler = server.ext.secondCall.args[0].method;
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('onPreHandler', () => {
    experiment('when the user is not on the request', () => {
      let result;

      beforeEach(async () => {
        const request = {};
        result = await onPreHandler(request, h);
      });

      test('the http.onPreRequest listener is not setup', async () => {
        expect(http.onPreRequest.called).to.be.false();
      });

      test('the handler continues', async () => {
        expect(result).to.equal(h.continue);
      });
    });

    experiment('when the user is on the request', () => {
      let result;

      beforeEach(async () => {
        const request = {
          defra: {
            user: {
              user_id: 'test-user-id'
            }
          }
        };
        result = await onPreHandler(request, h);
      });

      test('the http.onPreRequest listener is setup', async () => {
        expect(http.onPreRequest.called).to.be.true();
      });

      test('the listeners updates the headers to include the user id', async () => {
        const [handler] = http.onPreRequest.lastCall.args;
        const options = {};
        handler(options);

        expect(options.headers['defra-internal-user-id']).to.equal('test-user-id');
      });

      test('the handler continues', async () => {
        expect(result).to.equal(h.continue);
      });
    });
  });

  experiment('onPostHandler', () => {
    experiment('when the user is not on the request', () => {
      let result;

      beforeEach(async () => {
        const request = {};
        result = await onPostHandler(request, h);
      });

      test('the onPreRequest listener is not removed', async () => {
        expect(http.removePreRequestListener.called).to.be.false();
      });

      test('the handler continues', async () => {
        expect(result).to.equal(h.continue);
      });
    });

    experiment('when the user is on the request', () => {
      let result;

      beforeEach(async () => {
        const request = {
          defra: {
            user: {
              user_id: 'test-user-id'
            }
          }
        };
        result = await onPostHandler(request, h);
      });

      test('the onPreRequest listener is removed', async () => {
        expect(http.removePreRequestListener.called).to.be.true();
      });

      test('the handler continues', async () => {
        expect(result).to.equal(h.continue);
      });
    });
  });
});
