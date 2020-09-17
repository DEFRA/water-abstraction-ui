'use-strict';

const abstraction = (formValues) => {
  const [startMonth, startDay] = (formValues.startDate || '').toString().split(/[- T]/g);
  const [endMonth, endDay] = (formValues.endDate || '').toString().split(/[- T]/g);
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
  } else return { timeLimitedPeriod: false };
};

const purpose = (formValues, defaultCharges) => {
  const { purposeUse } = defaultCharges.find(item => item.purposeUse.id === formValues.purpose);
  return { purposeUse };
};

exports.purpose = purpose;
exports.time = time;
exports.abstraction = abstraction;
