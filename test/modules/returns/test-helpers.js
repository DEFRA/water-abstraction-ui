const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const sessionHelpers = require('../../../src/modules/returns/lib/session-helpers.js');

const { mapValues } = require('lodash');

/**
 * Maps internal form data back to a format it would have been in the request
 * For example, boolean fields are 'true' or 'false' strings
 *
 * @param  {Object} data - internal form data
 * @return {Object}      - request payload data
 */
const mapFormData = data => {
  return mapValues(data, (value) => {
    if (typeof (value) === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value;
  });
};

/**
 * Converts a request handler so that is has the same signature as an apply
 * function.  This allows us to wrap controllers and add tests for them to
 * support future refactoring work
 *
 * @param  {Function}  func     - the request handler to wrap
 * @param  {Boolean} isInternal - true for internal user, external otherwise
 * @return {Function}           - an async apply function(returnModel, formData)
 */
const convertHandlerToApply = (func, isInternal) => {
  return async (returnModel, formData) => {
    const token = 'test_token';
    const request = {
      payload: {
        ...mapFormData(formData),
        csrf_token: token
      },
      returns: {
        view: { },
        data: returnModel
      },
      view: {
        csrfToken: token
      },
      query: {
        returnId: returnModel.returnId
      },
      auth: {
        credentials: {
          scope: [ isInternal ? 'internal' : 'external' ]
        }
      }
    };

    sandbox.stub(sessionHelpers, 'saveSessionData').resolves();
    sandbox.stub(sessionHelpers, 'submitReturnData').resolves();
    const h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
    await func(request, h);

    let data;

    if (sessionHelpers.submitReturnData.callCount) {
      data = sessionHelpers.submitReturnData.lastCall.args[0];
    } else {
      data = sessionHelpers.saveSessionData.lastCall.args[1];
    }
    sandbox.restore();
    return data;
  };
};

module.exports = {
  convertHandlerToApply
};
