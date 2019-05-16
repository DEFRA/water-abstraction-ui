const Boom = require('boom');
const sinon = require('sinon');
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { redirectToReturn } = require('../../../../../src/internal/modules/internal-search/lib/redirect-to-return');

experiment('redirectToReturn', () => {
  const returnId = `v1:1:01/123:12345678:2017-11-01:2018-10-31`;
  const h = {};

  beforeEach(async () => {
    h.redirect = sinon.stub();
    sinon.stub(Boom, 'notFound');
    sinon.stub(Boom, 'unauthorized');
  });

  afterEach(async () => {
    Boom.notFound.restore();
    Boom.unauthorized.restore();
  });

  test('It should throw a 404 error if the return is not found', async () => {
    const view = {};
    redirectToReturn(returnId, view, h);
    expect(Boom.notFound.callCount).to.equal(1);
  });

  test('It should throw a 401 error if the return does not have a path property', async () => {
    const view = {
      returns: [{
        return_id: returnId
      }]
    };
    redirectToReturn(returnId, view, h);
    expect(Boom.unauthorized.callCount).to.equal(1);
  });

  test('It should redirect if the return has a path property', async () => {
    const view = {
      returns: [{
        return_id: returnId,
        path: '/some/path'
      }]
    };
    redirectToReturn(returnId, view, h);
    expect(h.redirect.firstCall.args[0]).to.equal(view.returns[0].path);
  });
});
