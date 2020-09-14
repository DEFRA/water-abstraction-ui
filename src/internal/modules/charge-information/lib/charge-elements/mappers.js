'use-strict';

const mapAbstractionPeriod = (formValues) => {
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

const mapTimeLimit = (formValues) => {
  if (formValues.timeLimitedPeriod === 'yes') {
    return {
      timeLimitedPeriod: {
        startDate: formValues.startDate,
        endDate: formValues.endDate
      }
    };
  } else return { timeLimitedPeriod: 'no' };
};

exports.mapTimeLimit = mapTimeLimit;
exports.mapAbstractionPeriod = mapAbstractionPeriod;
