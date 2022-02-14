const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { alcsExist } = require('internal/lib/view-engine/filters/alcs-exist');

experiment('alcsExist', () => {
  test('returns true if any elements have a scheme of alcs', () => {
    expect(alcsExist([
      { scheme: 'sroc' },
      { scheme: 'alcs' },
      { scheme: 'sroc' }
    ])).to.equal(true);
  });

  test('returns false if no elements have a scheme of alcs', () => {
    expect(alcsExist([
      { scheme: 'sroc' },
      { scheme: 'sroc' },
      { scheme: 'sroc' }
    ])).to.equal(false);
  });
});
