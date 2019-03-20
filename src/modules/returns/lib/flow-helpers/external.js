const { get } = require('lodash');

const {
  STEP_RETURNS,
  STEP_START,
  STEP_NIL_RETURN,
  STEP_METHOD,
  STEP_UNITS,
  STEP_BASIS,
  STEP_QUANTITIES,
  STEP_METER_DETAILS,
  STEP_METER_UNITS,
  STEP_METER_READINGS,
  STEP_CONFIRM,
  STEP_SUBMITTED
} = require('./steps');

const next = {
  [STEP_START]: (request, data) => {
    const isNil = get(data, 'isNil', false);
    return isNil ? STEP_NIL_RETURN : STEP_METHOD;
  },
  [STEP_NIL_RETURN]: () => STEP_SUBMITTED,
  [STEP_METHOD]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    return isVolumes ? STEP_UNITS : STEP_METER_DETAILS;
  },
  [STEP_UNITS]: () => STEP_BASIS,
  [STEP_BASIS]: (request, data) => {
    const isMeasured = get(data, 'reading.type') === 'measured';
    const isTotal = get(data, 'reading.totalFlag', false);
    if (isMeasured) {
      return STEP_METER_DETAILS;
    }
    return isTotal ? STEP_CONFIRM : STEP_QUANTITIES;
  },
  [STEP_QUANTITIES]: () => STEP_CONFIRM,
  [STEP_CONFIRM]: () => STEP_SUBMITTED,
  [STEP_METER_DETAILS]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    const isSingleTotal = get(data, 'reading.totalFlag', false);
    if (isVolumes) {
      return isSingleTotal ? STEP_CONFIRM : STEP_QUANTITIES;
    }
    return STEP_METER_UNITS;
  },
  [STEP_METER_UNITS]: () => STEP_METER_READINGS,
  [STEP_METER_READINGS]: () => STEP_CONFIRM
};

const previous = {
  [STEP_START]: () => STEP_RETURNS,
  [STEP_NIL_RETURN]: () => STEP_START,
  [STEP_METHOD]: () => STEP_START,
  [STEP_UNITS]: () => STEP_METHOD,
  [STEP_BASIS]: () => STEP_UNITS,
  [STEP_QUANTITIES]: (request, data) => {
    const isMeasured = get(data, 'reading.type') === 'measured';
    return isMeasured ? STEP_METER_DETAILS : STEP_BASIS;
  },
  [STEP_CONFIRM]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    return isVolumes ? STEP_QUANTITIES : STEP_METER_READINGS;
  },
  [STEP_METER_DETAILS]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    return isVolumes ? STEP_BASIS : STEP_METHOD;
  },
  [STEP_METER_UNITS]: () => STEP_METER_DETAILS,
  [STEP_METER_READINGS]: () => STEP_METER_UNITS
};

module.exports = {
  next,
  previous
};
