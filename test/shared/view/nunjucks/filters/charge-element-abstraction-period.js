const { chargeElementAbstractionPeriod } = require('shared/view/nunjucks/filters/charge-element-abstraction-period');

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

experiment('shared/view/nunjucks/filters/charge-element-abstraction-period', () => {
  const chargeElement = {
    abstractionPeriod: {
      startDay: 1,
      startMonth: 1,
      endDay: 31,
      endMonth: 3
    }
  };

  test('the abstraction period is returned with GDS format dates', async () => {
    const str = chargeElementAbstractionPeriod(chargeElement);
    expect(str).to.equal('1 January to 31 March');
  });
});
