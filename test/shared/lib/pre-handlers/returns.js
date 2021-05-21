'use strict';

const { set } = require('lodash');
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const preHandlers = require('shared/lib/pre-handlers/returns');

const createError = code => {
  const error = new Error('oops');
  error.statusCode = code;
  return error;
};

const returnId = 'test-return-id';

experiment('shared/lib/pre-handlers/returns', () => {
  let request, h;

  beforeEach(async () => {
    h = {};
    request = {
      params: {
      },
      query: {
      }
    };
    const returnsStub = {
      getReturnById: sandbox.stub().resolves({ id: returnId })
    };
    set(request, 'services.water.returns', returnsStub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturnById', () => {
    let result;

    experiment('when the returnId is a url param', () => {
      beforeEach(async () => {
        request.params.returnId = returnId;
        result = await preHandlers.getReturnById(request, h);
      });

      test('gets the return', () => {
        const [id] = request.services.water.returns.getReturnById.lastCall.args;
        expect(id).to.equal(returnId);
      });

      test('returns the return', () => {
        expect(result).to.equal({ id: returnId });
      });
    });

    experiment('when the returnId is a query param', () => {
      beforeEach(async () => {
        request.query.returnId = returnId;
        result = await preHandlers.getReturnById(request, h);
      });

      test('gets the return', () => {
        const [id] = request.services.water.returns.getReturnById.lastCall.args;
        expect(id).to.equal(returnId);
      });

      test('returns the return', () => {
        expect(result).to.equal({ id: returnId });
      });
    });

    experiment('when the return is not found', () => {
      beforeEach(async () => {
        request.params.returnId = returnId;
        request.services.water.returns.getReturnById.throws(createError(404));
        result = await preHandlers.getReturnById(request, h);
      });

      test('a Boom notFound error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.payload.error).to.equal('Not Found');
        expect(result.message).to.equal('Return test-return-id not found');
      });
    });

    experiment('unexpected errors are rethrown', () => {
      beforeEach(async () => {
        request.services.water.returns.getReturnById.throws(createError(500));
      });

      test('a Boom notFound error is returned', () => {
        const func = () => preHandlers.getReturnById(request, h);
        expect(func()).to.reject();
      });
    });
  });
});
