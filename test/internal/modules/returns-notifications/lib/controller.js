'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const Joi = require('joi');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-notifications/lib/controller');
const reducer = require('internal/modules/returns-notifications/lib/reducer');

const formContainer = {
  form: () => ({
    action: '/test/path',
    method: 'POST',
    fields: [{
      name: 'foo',
      options: {

      }
    }],
    validationType: 'joi'
  }),
  schema: () => Joi.object({
    foo: Joi.string().valid('bar')
  })
};

const actionCreator = (request, formValues) => ({
  type: 'test',
  payload: formValues
});

experiment('internal/modules/returns-notifications/lib/controller', () => {
  let request;
  let h;

  beforeEach(async () => {
    request = {
      yar: {
        set: sandbox.stub(),
        get: sandbox.stub().returns({ currentState: true })
      },
      payload: {
        csrf_token: '00000000-0000-0000-0000-000000000000'
      },
      pre: {
        document: {
          document: {
            licenceNumber: '01/234/ABC'
          }
        }
      }
    };

    h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };

    sandbox.stub(reducer, 'reducer').returns({
      nextState: true
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createGetHandler', () => {
    beforeEach(async () => {
      await controller.createGetHandler(request, h, formContainer);
    });

    test('the form template is used', async () => {
      const [ template ] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('the caption includes the licence number', async () => {
      const [ , { caption } ] = h.view.lastCall.args;
      expect(caption).to.equal('Licence 01/234/ABC');
    });

    test('the back link is the "check answers" page', async () => {
      const [ , { back } ] = h.view.lastCall.args;
      expect(back).to.equal('/returns-notifications/check-answers');
    });

    test('includes the form object', async () => {
      const [ , { form } ] = h.view.lastCall.args;
      expect(form).to.be.an.object();
      expect(form.fields[0].name).to.equal('foo');
    });
  });

  experiment('.createPostHandler', () => {
    experiment('when the request payload is invalid', () => {
      beforeEach(async () => {
        request.payload.foo = 'not-bar';
        await controller.createPostHandler(request, h, formContainer, actionCreator);
      });

      test('the user is redirected', async () => {
        expect(h.postRedirectGet.calledWith('/test/path'));
      });

      test('the state is not modified', async () => {
        expect(request.yar.set.called).to.be.false();
      });
    });

    experiment('when the request payload is valid and redirect path is a string', () => {
      beforeEach(async () => {
        request.payload.foo = 'bar';
        await controller.createPostHandler(request, h, formContainer, actionCreator, '/next/path');
      });

      test('the current state is fetched from the session', async () => {
        expect(request.yar.get.calledWith('returns.paper-forms')).to.be.true();
      });

      test('an action is created an dispatched in the reducer', async () => {
        const [currentState, action] = reducer.reducer.lastCall.args;
        expect(currentState).to.equal({
          currentState: true
        });
        expect(action).to.equal({
          type: 'test',
          payload: {
            foo: 'bar'
          }
        });
      });

      test('the next state is stored in the session', async () => {
        expect(request.yar.set.calledWith(
          'returns.paper-forms', { nextState: true }
        )).to.be.true();
      });

      test('the user is redirected', async () => {
        expect(h.redirect.calledWith('/next/path')).to.be.true();
      });
    });

    experiment('when the request payload is valid and redirect path is a function', () => {
      let getNextPath;

      beforeEach(async () => {
        request.payload.foo = 'bar';
        getNextPath = sandbox.stub().returns('/dynamic/next/path');
        await controller.createPostHandler(request, h, formContainer, actionCreator, getNextPath);
      });

      test('the function that generates the path is called with the correct params', async () => {
        const { args } = getNextPath.lastCall;
        expect(args[0]).to.equal(request);
        expect(args[1].form).to.be.an.object();
        expect(args[1].document).to.equal(request.pre.document);
        expect(args[1].nextState).to.equal({ nextState: true });
      });

      test('the user is redirected', async () => {
        expect(h.redirect.calledWith('/dynamic/next/path')).to.be.true();
      });
    });
  });
});
