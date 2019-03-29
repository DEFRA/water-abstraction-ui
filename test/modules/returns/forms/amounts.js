const { experiment, test } = exports.lab = require('lab').script();
const { expect } = require('code');

const { convertHandlerToApply } = require('../test-helpers');
const controller = require('../../../../src/modules/returns/controllers/edit');

experiment('applyNilReturn', () => {
  const apply = convertHandlerToApply(controller.postAmounts);

  const returnModel = {
    returnId: 'return_1',
    lines: [],
    meters: [],
    reading: {}
  };

  test('sets isNil flag if isNil is true, and deletes lines, meters and reading', async () => {
    const formData = { isNil: true };
    const result = await apply(returnModel, formData);
    expect(result.isNil).to.equal(true);
    expect(Object.keys(result)).to.not.include(['lines', 'meters', 'reading']);
  });

  test('clears isNil flag if isNil is false', async () => {
    const formData = { isNil: false };
    const result = await apply(returnModel, formData);
    expect(result.isNil).to.equal(false);
    expect(Object.keys(result)).to.include(['lines', 'meters', 'reading']);
  });
});
