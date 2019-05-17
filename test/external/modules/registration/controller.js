const { expect } = require('code');
const { beforeEach, experiment, test } = exports.lab = require('lab').script();
const sinon = require('sinon');

const testHelpers = require('../../test-helpers');
const controller = require('../../../../src/external/modules/registration/controller');

experiment('getRegisterSuccess', () => {
  let viewContext;

  beforeEach(async () => {
    const request = testHelpers.getMinimalRequest();
    request.query = {
      email: 'test@example.com'
    };

    const h = {
      view: sinon.spy()
    };

    controller.getRegisterSuccess(request, h);

    viewContext = h.view.args[0][1];
  });

  test('adds email from request to view context', async () => {
    expect(viewContext.email).to.equal('test@example.com');
  });
});

experiment('getUrlWithEmailParam', () => {
  test('omits the email query param when includeEmail is false', async () => {
    const options = {
      redirect: '/url',
      includeEmail: false
    };
    const result = controller.getUrlWithEmailParam('email-param', options);
    expect(result).to.equal('/url');
  });

  test('adds the email query param when includeEmail is true', async () => {
    const options = {
      redirect: '/url',
      includeEmail: true
    };
    const result = controller.getUrlWithEmailParam('email-param', options);
    expect(result).to.equal('/url?email=email-param');
  });

  test('encodes the email address part', async () => {
    const options = {
      redirect: '/url',
      includeEmail: true
    };
    const result = controller.getUrlWithEmailParam('test@example.com', options);
    expect(result).to.equal('/url?email=test%40example.com');
  });
});
