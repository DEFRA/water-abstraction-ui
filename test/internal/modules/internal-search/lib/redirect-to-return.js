const sinon = require('sinon');
const { expect, fail } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { redirectToReturn } = require('internal/modules/internal-search/lib/redirect-to-return');

experiment('redirectToReturn', () => {
  const returnId = `v1:1:01/123:12345678:2017-11-01:2018-10-31`;
  const h = {};

  beforeEach(async () => {
    h.redirect = sinon.stub();
  });

  test('It should throw a 404 error if the return is not found', async () => {
    const view = {};

    try {
      redirectToReturn(returnId, view, h);
      fail('Should not get here');
    } catch (err) {
      expect(err.isBoom).to.be.true();
      expect(err.output.statusCode).to.equal(404);
    }
  });

  test('It should throw a 401 error if the return does not have a path property', async () => {
    const view = {
      returns: [{
        return_id: returnId
      }]
    };

    try {
      redirectToReturn(returnId, view, h);
      fail('Should not get here');
    } catch (err) {
      expect(err.isBoom).to.be.true();
      expect(err.output.statusCode).to.equal(401);
    }
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
