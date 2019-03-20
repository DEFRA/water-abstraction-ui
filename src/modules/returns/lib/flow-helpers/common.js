const { get } = require('lodash');

const {
  STEP_BASIS,
  STEP_QUANTITIES,
  STEP_METER_DETAILS,
  STEP_METER_UNITS,
  STEP_CONFIRM
} = require('./steps');

const next = {
  [STEP_BASIS]: (request, data) => {
    const isMeasured = get(data, 'reading.type') === 'measured';
    const isTotal = get(data, 'reading.totalFlag', false);
    if (isMeasured) {
      return STEP_METER_DETAILS;
    }
    return isTotal ? STEP_CONFIRM : STEP_QUANTITIES;
  },
  [STEP_METER_DETAILS]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    const isSingleTotal = get(data, 'reading.totalFlag', false);
    if (isVolumes) {
      return isSingleTotal ? STEP_CONFIRM : STEP_QUANTITIES;
    }
    return STEP_METER_UNITS;
  }
};

const previous = {

};

module.exports = {
  next,
  previous
};
