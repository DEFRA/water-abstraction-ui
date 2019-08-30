const { abstractionPeriod } = require('./abstraction-period');

const getStartDate = chargeElement =>
  `${chargeElement.abstractionPeriodStartDay}/${chargeElement.abstractionPeriodStartMonth}`;

const getEndDate = chargeElement =>
  `${chargeElement.abstractionPeriodEndDay}/${chargeElement.abstractionPeriodEndMonth}`;

/**
 * Given a charge element object, returns an abstraction period in the format
 * 1 January to 5 March
 * @param  {Object} chargeElement - charge element object
 * @return {String}               - formatted abstraction period
 */
const chargeElementAbstractionPeriod = chargeElement => {
  const start = getStartDate(chargeElement);
  const end = getEndDate(chargeElement);

  return `${abstractionPeriod(start)} to ${abstractionPeriod(end)}`;
};

exports.chargeElementAbstractionPeriod = chargeElementAbstractionPeriod;
