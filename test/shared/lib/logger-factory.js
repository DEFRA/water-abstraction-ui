const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const helpers = require('@envage/water-abstraction-helpers');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const factory = require('shared/lib/logger-factory');

experiment('shared/lib/logger-factory', () => {
  beforeEach(async () => {
    sandbox.stub(helpers.logger, 'createLogger').returns({
      error: sandbox.spy()
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    let logger;

    const config = {
      logger: {
        testing: true
      }
    };

    const request = {
      getUserJourney: () => ({
        userJourney: {
          'user-agent': 'safari'
        }
      }),
      url: {
        href: 'http://example.com/testing'
      }
    };

    beforeEach(async () => {
      logger = factory.create(config);
    });

    test('passes the logger config to the createLogger function', async () => {
      expect(helpers.logger.createLogger.calledWith({
        testing: true
      })).to.be.true();
    });

    test('adds the errorWithJourney function', async () => {
      expect(logger.errorWithJourney).to.be.a.function();
    });

    test('errorWithJourney calls the error function of the logger', async () => {
      const err = new Error('whoops');
      logger.errorWithJourney('message', err);

      const [msg, error] = logger.error.lastCall.args;

      expect(msg).to.equal('message');
      expect(error).to.equal(err);
    });

    test('errorWithJourney adds journey data when no extra error params are included', async () => {
      const err = new Error('whoops');
      logger.errorWithJourney('message', err, request);

      const [msg, error, params] = logger.error.lastCall.args;

      expect(msg).to.equal('message');
      expect(error).to.equal(err);
      expect(params.userJourney).to.equal({
        'user-agent': 'safari'
      });
    });

    test('errorWithJourney adds journey data to the error params', async () => {
      const err = new Error('whoops');
      const params = {
        numbers: {
          one: 1
        }
      };
      logger.errorWithJourney('message', err, request, params);

      const [msg, error, parameters] = logger.error.lastCall.args;

      expect(msg).to.equal('message');
      expect(error).to.equal(err);
      expect(parameters).to.equal({
        userJourney: { 'user-agent': 'safari' },
        numbers: { one: 1 },
        requestDetails: {
          url: 'http://example.com/testing'
        }
      });
    });
  });
});
