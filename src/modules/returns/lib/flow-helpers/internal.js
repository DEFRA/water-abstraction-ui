const { get } = require('lodash');

const {
  STEP_LICENCES,
  STEP_INTERNAL_ROUTING,
  STEP_LOG_RECEIPT,
  STEP_RECEIPT_LOGGED,
  STEP_DATE_RECEIVED,
  STEP_START,
  STEP_NIL_RETURN,
  STEP_METHOD,
  STEP_INTERNAL_METHOD,
  STEP_UNITS,
  STEP_SINGLE_TOTAL,
  STEP_SINGLE_TOTAL_DATES,
  STEP_BASIS,
  STEP_QUANTITIES,
  STEP_METER_DETAILS_PROVIDED,
  STEP_METER_DETAILS,
  STEP_METER_UNITS,
  STEP_METER_READINGS,
  STEP_CONFIRM,
  STEP_SUBMITTED,
  STEP_QUERY_LOGGED
} = require('./steps');

const common = require('./common');

const isMeterDetailsProvided = data =>
  get(data, 'meters[0].meterDetailsProvided', false);

const isVolumes = data =>
  get(data, 'reading.method') === 'abstractionVolumes';

const isNil = data => get(data, 'isNil', false);

const isSingleTotal = data => get(data, 'reading.totalFlag', false);

const next = {
  [STEP_INTERNAL_ROUTING]: (request, data) => {
    const action = get(data, 'action');
    const actions = {
      log_receipt: STEP_LOG_RECEIPT,
      submit: STEP_DATE_RECEIVED,
      set_under_query: STEP_QUERY_LOGGED,
      clear_under_query: STEP_QUERY_LOGGED
    };
    return actions[action];
  },
  [STEP_LOG_RECEIPT]: () => STEP_RECEIPT_LOGGED,
  [STEP_DATE_RECEIVED]: () => STEP_START,
  [STEP_START]: (request, data) => {
    return isNil(data) ? STEP_NIL_RETURN : STEP_INTERNAL_METHOD;
  },
  [STEP_INTERNAL_METHOD]: () => STEP_UNITS,
  [STEP_NIL_RETURN]: () => STEP_SUBMITTED,
  [STEP_METHOD]: (request, data) => {
    return isVolumes(data) ? STEP_UNITS : STEP_METER_DETAILS;
  },
  [STEP_UNITS]: () => STEP_METER_DETAILS_PROVIDED,
  [STEP_SINGLE_TOTAL]: (request, data) => {
    return isSingleTotal(data) ? STEP_SINGLE_TOTAL_DATES : STEP_QUANTITIES;
  },
  [STEP_SINGLE_TOTAL_DATES]: () => STEP_QUANTITIES,
  [STEP_BASIS]: common.next[STEP_BASIS],
  [STEP_QUANTITIES]: () => STEP_CONFIRM,
  [STEP_CONFIRM]: () => STEP_SUBMITTED,
  [STEP_METER_DETAILS_PROVIDED]: (request, data) => {
    if (isMeterDetailsProvided(data)) {
      return STEP_METER_DETAILS;
    }
    return isVolumes(data) ? STEP_SINGLE_TOTAL : STEP_METER_READINGS;
  },
  [STEP_METER_DETAILS]: (request, data) => {
    return isVolumes(data) ? STEP_SINGLE_TOTAL : STEP_METER_READINGS;
  },
  [STEP_METER_UNITS]: () => STEP_METER_READINGS,
  [STEP_METER_READINGS]: () => STEP_CONFIRM
};

const previous = {
  [STEP_INTERNAL_ROUTING]: () => STEP_LICENCES,
  [STEP_DATE_RECEIVED]: () => STEP_INTERNAL_ROUTING,
  [STEP_START]: () => STEP_DATE_RECEIVED,
  [STEP_INTERNAL_METHOD]: () => STEP_START,
  [STEP_NIL_RETURN]: () => STEP_START,
  [STEP_METHOD]: () => STEP_START,
  [STEP_UNITS]: () => STEP_INTERNAL_METHOD,
  [STEP_SINGLE_TOTAL]: (request, data) => {
    return isMeterDetailsProvided(data) ? STEP_METER_DETAILS : STEP_METER_DETAILS_PROVIDED;
  },
  [STEP_SINGLE_TOTAL_DATES]: () => STEP_SINGLE_TOTAL,
  [STEP_BASIS]: () => STEP_SINGLE_TOTAL,
  [STEP_QUANTITIES]: (request, data) => {
    return isSingleTotal(data) ? STEP_SINGLE_TOTAL_DATES : STEP_SINGLE_TOTAL;
  },
  [STEP_CONFIRM]: (request, data) => {
    return isVolumes(data) ? STEP_QUANTITIES : STEP_METER_READINGS;
  },
  [STEP_METER_DETAILS_PROVIDED]: () => STEP_UNITS,
  [STEP_METER_DETAILS]: () => STEP_METER_DETAILS_PROVIDED,
  [STEP_METER_UNITS]: () => STEP_METER_DETAILS,
  [STEP_METER_READINGS]: (request, data) => {
    return isMeterDetailsProvided(data)
      ? STEP_METER_DETAILS
      : STEP_METER_DETAILS_PROVIDED;
  }
};

module.exports = {
  next,
  previous
};
