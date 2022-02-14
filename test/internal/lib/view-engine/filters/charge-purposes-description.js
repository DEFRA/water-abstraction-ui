const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { chargePurposesDescriptions } = require('internal/lib/view-engine/filters/charge-purposes-descriptions');

experiment('chargePurposesDescriptions', () => {
  test('returns text with html character entities transformed', () => {
    expect(chargePurposesDescriptions([
      { description: 'Element A' },
      { description: 'Element B' },
      { description: 'Element C' }
    ])).to.equal('Element A,\nElement B,\nElement C');
  });
});
