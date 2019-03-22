const {
  STEP_RETURNS,
  STEP_START,
  STEP_NIL_RETURN,
  STEP_METHOD,
  STEP_UNITS,
  STEP_QUANTITIES,
  STEP_METER_ROLLOVER,
  STEP_METER_DETAILS,
  STEP_METER_UNITS,
  STEP_METER_READINGS,
  STEP_CONFIRM,
  STEP_SUBMITTED
} = require('./steps');

const {
  isNil, isVolumes, isMeasured, isOneMeter
} = require('./helpers');

const next = {
  [STEP_START]: data => {
    return isNil(data) ? STEP_NIL_RETURN : STEP_METHOD;
  },
  [STEP_NIL_RETURN]: () => STEP_SUBMITTED,
  [STEP_METHOD]: data => {
    return isOneMeter(data) ? STEP_METER_ROLLOVER : STEP_UNITS;
  },
  [STEP_METER_ROLLOVER]: () => STEP_UNITS,
  [STEP_UNITS]: data => {
    return isVolumes(data) ? STEP_QUANTITIES : STEP_METER_READINGS;
  },
  [STEP_QUANTITIES]: data => {
    return isMeasured(data) ? STEP_METER_DETAILS : STEP_CONFIRM;
  },
  [STEP_CONFIRM]: () => STEP_SUBMITTED,
  [STEP_METER_DETAILS]: () => STEP_CONFIRM,
  [STEP_METER_UNITS]: () => STEP_METER_READINGS,
  [STEP_METER_READINGS]: () => STEP_METER_DETAILS
};

const previous = {
  [STEP_START]: () => STEP_RETURNS,
  [STEP_NIL_RETURN]: () => STEP_START,
  [STEP_METHOD]: () => STEP_START,
  [STEP_METER_ROLLOVER]: () => STEP_METHOD,
  [STEP_UNITS]: data => {
    return isOneMeter(data) ? STEP_METER_ROLLOVER : STEP_METHOD;
  },
  [STEP_QUANTITIES]: () => STEP_UNITS,
  [STEP_CONFIRM]: data => {
    if (isMeasured(data)) {
      return STEP_METER_DETAILS;
    }
    return isVolumes(data) ? STEP_QUANTITIES : STEP_METER_READINGS;
  },
  [STEP_METER_DETAILS]: data => {
    return isOneMeter(data) ? STEP_METER_READINGS : STEP_QUANTITIES;
  },
  [STEP_METER_UNITS]: () => STEP_METER_DETAILS,
  [STEP_METER_READINGS]: () => STEP_UNITS
};

module.exports = {
  next,
  previous
};
