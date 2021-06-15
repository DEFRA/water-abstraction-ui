'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const preHandlers = require('external/modules/returns/pre-handlers');

experiment('external/modules/returns/controllers/pre-handlers', () => {
  let h, request, response;

  beforeEach(async () => {
    h = {
      redirect: sandbox.stub().returnsThis(),
      takeover: sandbox.stub(),
      continue: 'continue'
    };
    request = {
      model: {
        id: 'test-return-id'
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.assertReturnStatusIsDue', () => {
    experiment('when the return is due', () => {
      beforeEach(() => {
        request.model.status = 'due';
        response = preHandlers.assertReturnStatusIsDue(request, h);
      });

      test('the pre-handler returns h.continue', () => {
        expect(response).to.equal(h.continue);
      });

      test('the user is not redirected', () => {
        expect(h.redirect.called).to.be.false();
      });

      test('the response is not taken over', () => {
        expect(h.takeover.called).to.be.false();
      });
    });

    experiment('when the return is completed', () => {
      beforeEach(() => {
        request.model.status = 'completed';
        response = preHandlers.assertReturnStatusIsDue(request, h);
      });

      test('the user is redirected to the completed return page', () => {
        expect(h.redirect.calledWith(
          `/returns/return?id=${request.model.id}`
        )).to.be.true();
      });

      test('the response is taken over', () => {
        expect(h.takeover.called).to.be.true();
      });
    });
  });
});
