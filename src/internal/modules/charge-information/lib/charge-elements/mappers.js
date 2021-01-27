'use-strict';

const { SOURCES, EIUC_SOURCE_OTHER } = require('./constants');
const { isEmpty } = require('lodash');

const abstraction = (formValues) => {
  const [startMonth, startDay] = (formValues.startDate).toString().split(/[- T]/g);
  const [endMonth, endDay] = (formValues.endDate).toString().split(/[- T]/g);
  return {
    abstractionPeriod: {
      startDay,
      startMonth,
      endDay,
      endMonth
    }
  };
};

const time = (formValues) => {
  if (formValues.timeLimitedPeriod === 'yes') {
    return {
      timeLimitedPeriod: {
        startDate: formValues.startDate,
        endDate: formValues.endDate
      }
    };
  }
  return { timeLimitedPeriod: null };
};

const purpose = (formValues, defaultCharges) => {
  const { purposePrimary, purposeSecondary, purposeUse } = defaultCharges.find(item => item.purposeUse.id === formValues.purpose);
  return { purposePrimary, purposeSecondary, purposeUse };
};

const source = formValues => ({
  source: formValues.source,
  eiucSource: formValues.source === SOURCES.tidal ? formValues.source : EIUC_SOURCE_OTHER
});

const quantities = formValues => {
  const { authorisedAnnualQuantity, billableAnnualQuantity } = formValues;
  return {
    authorisedAnnualQuantity: parseFloat(authorisedAnnualQuantity),
    billableAnnualQuantity: isEmpty(billableAnnualQuantity) ? null : parseFloat(billableAnnualQuantity)
  };
};

exports.purpose = purpose;
exports.time = time;
exports.abstraction = abstraction;
exports.source = source;
exports.quantities = quantities;
