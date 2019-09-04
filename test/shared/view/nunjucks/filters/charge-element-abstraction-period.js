const { chargeElementAbstractionPeriod } = require('shared/view/nunjucks/filters/charge-element-abstraction-period');

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

experiment('shared/view/nunjucks/filters/charge-element-abstraction-period', () => {
  const chargeElement = {
    'abstractionPeriodStartDay': 1,
    'abstractionPeriodStartMonth': 1,
    'abstractionPeriodEndDay': 31,
    'abstractionPeriodEndMonth': 3
  };

  test('the abstraction period is returned with GDS format dates', async () => {
    const str = chargeElementAbstractionPeriod(chargeElement);
    expect(str).to.equal('1 January to 31 March');
  });
});
