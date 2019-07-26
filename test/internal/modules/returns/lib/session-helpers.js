const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');

const sessionHelpers = require('internal/modules/returns/lib/session-helpers');
const { scope } = require('internal/lib/constants');

const getTestRequest = (returnId, isInternal) => {
  return {
    auth: {
      credentials: {
        scope: [isInternal ? scope.internal : scope.external]
      }
    },
    query: {
      returnId
    },
    yar: {
      get: sinon.stub().returns(),
      set: sinon.spy(),
      clear: sinon.spy()
    }
  };
};

experiment('getSessionData', () => {
  test('for an internal user, the correct key is used', async () => {
    const returnId = '123';
    const savedData = { returnId };
    const request = getTestRequest(returnId, true);

    request.yar.get.returns(savedData);

    const data = sessionHelpers.getSessionData(request);
    const passedKey = request.yar.get.args[0][0];

    expect(passedKey).to.equal('internalReturnFlow:123');
    expect(data).to.equal(savedData);
  });

  test('for an external user, the correct key is used', async () => {
    const returnId = '987';
    const savedData = { returnId };
    const request = getTestRequest(returnId, false);

    request.yar.get.returns(savedData);

    const data = sessionHelpers.getSessionData(request);
    const passedKey = request.yar.get.args[0][0];

    expect(passedKey).to.equal('externalReturnFlow:987');
    expect(data).to.equal(savedData);
  });

  test('throws an error if no data for the key', async () => {
    const returnId = '123';
    const request = getTestRequest(returnId, false);

    expect(() => {
      sessionHelpers.getSessionData(request);
    }).to.throw();
  });
});

experiment('saveSessionData', () => {
  test('for an internal user, the correct key is used', async () => {
    const returnId = '123';
    const data = { returnId };
    const request = getTestRequest(returnId, true);

    sessionHelpers.saveSessionData(request, data);

    const passedKey = request.yar.set.args[0][0];
    expect(passedKey).to.equal('internalReturnFlow:123');
  });

  test('for an external user, the correct key is used', async () => {
    const returnId = '987';
    const data = { returnId };
    const request = getTestRequest(returnId, false);

    sessionHelpers.saveSessionData(request, data);

    const passedKey = request.yar.set.args[0][0];
    expect(passedKey).to.equal('externalReturnFlow:987');
  });
});

experiment('deleteSessionData', () => {
  test('for an internal user, the correct key is used', async () => {
    const returnId = '123';
    const request = getTestRequest(returnId, true);

    sessionHelpers.deleteSessionData(request);

    const passedKey = request.yar.clear.args[0][0];
    expect(passedKey).to.equal('internalReturnFlow:123');
  });

  test('for an external user, the correct key is used', async () => {
    const returnId = '123';
    const request = getTestRequest(returnId, false);

    sessionHelpers.deleteSessionData(request);

    const passedKey = request.yar.clear.args[0][0];
    expect(passedKey).to.equal('externalReturnFlow:123');
  });
});
