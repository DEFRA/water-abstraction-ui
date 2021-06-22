// redirectTo;
// isLicenceNumberValid;
// fetchConditionsForLicence;
// getCaption;
// getSelectedConditionText;
// handlePost;

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');

const helpers = require('../../../../../src/internal/modules/gauging-stations/lib/helpers');
const session = require('../../../../../src/internal/modules/gauging-stations/lib/session');

experiment('internal/modules/gauging-stations/controller', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
    sandbox.stub(session, 'get').resolves();
    sandbox.stub(session, 'merge').resolves({});
  });

  afterEach(async () => sandbox.restore());

  experiment('.redirectTo', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/some-random-place-in-the-workflow'
    };
    const desiredPath = '/a-new-destination';
    const h = { redirect: sandbox.spy() };

    experiment('When the check stage has been reached', () => {
      beforeEach(() => {
        session.get.returns({
          checkStageReached: true
        });
        helpers.redirectTo(request, h, desiredPath);
      });
      afterEach(async () => sandbox.restore());
      test('redirects the user to the end of the flow', async () => {
        expect(h.redirect.calledWith(`${request.path}/../check`));
      });
    });

    experiment('When the check stage has NOT been reached', () => {
      beforeEach(() => {
        session.get.returns({
          checkStageReached: false
        });
        helpers.redirectTo(request, h, desiredPath);
      });
      afterEach(async () => sandbox.restore());
      test('redirects the user to the default destination in the flow', async () => {
        expect(h.redirect.calledWith(`${request.path}/../${desiredPath}`));
      });
    });
  });
});
