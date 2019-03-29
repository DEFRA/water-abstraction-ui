const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { convertHandlerToApply } = require('../test-helpers');
const form = require('../../../../src/modules/returns/forms/method');
const controller = require('../../../../src/modules/returns/controllers/edit');

experiment('returns method form', () => {

});

experiment('applyMethod', () => {
  const apply = convertHandlerToApply(controller.postMethod);

  const returnModel = {
    returnId: 'return_1'
  };

  test('sets reading method and type', async () => {
    const formData = { method: 'oneMeter,measured' };
    const result = await apply(returnModel, formData);
    expect(result.reading.method).to.equal('oneMeter');
    expect(result.reading.type).to.equal('measured');
  });
});
