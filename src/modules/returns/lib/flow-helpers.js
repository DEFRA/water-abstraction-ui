const { get } = require('lodash');

const STEP_START = '/return';
const STEP_NIL_RETURN = '/return/nil-return';
const STEP_METHOD = '/return/method';
const STEP_METER_DETAILS = '/return/meter/details';
const STEP_METER_UNITS = '/return/meter/units';
const STEP_METER_READINGS = '/return/meter/readings';
const STEP_UNITS = '/return/units';
const STEP_SINGLE_TOTAL = '/return/single-total';
const STEP_BASIS = '/return/basis';
const STEP_QUANTITIES = '/return/quantities';
const STEP_CONFIRM = '/return/confirm';
const STEP_SUBMITTED = '/return/submitted';

/**
 * Gets path with return ID query param and admin/ if required depending on scopes
 * @param {String} base path
 * @param {Object} request - HAPI request instance
 * @param {Object} data - return model data
 * @return {String} path
 */
const getPath = (path, request, data) => {
  const returnId = get(data, 'returnId', request.query.returnId);
  const isInternal = request.permissions.hasPermission('admin.defra');
  const scopedPath = (isInternal ? `/admin${path}` : path);
  return `${scopedPath}?returnId=${returnId}`;
};

const next = {
  [STEP_START]: (request, data) => {
    const isNil = get(data, 'isNil', false);
    return getPath(isNil ? STEP_NIL_RETURN : STEP_METHOD, request, data);
  },
  [STEP_NIL_RETURN]: (request, data) => {
    return getPath(STEP_SUBMITTED, request, data);
  },
  [STEP_METHOD]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    return getPath(isVolumes ? STEP_UNITS : STEP_METER_DETAILS, request, data);
  },
  [STEP_UNITS]: (request, data) => {
    const isInternal = request.permissions.hasPermission('admin.defra');
    return getPath(isInternal ? STEP_SINGLE_TOTAL : STEP_BASIS, request, data);
  },
  [STEP_SINGLE_TOTAL]: (request, data) => {
    return getPath(STEP_UNITS, request, data);
  },
  [STEP_BASIS]: (request, data) => {
    const isMeasured = get(data, 'reading.type') === 'measured';
    const isTotal = get(data, 'reading.totalFlag', false);
    let next;
    if (isMeasured) {
      next = STEP_METER_DETAILS;
    } else {
      next = isTotal ? STEP_CONFIRM : STEP_QUANTITIES;
    }
    return getPath(next, request, data);
  },
  [STEP_QUANTITIES]: (request, data) => {
    return getPath(STEP_CONFIRM, request, data);
  },
  [STEP_CONFIRM]: (request, data) => {
    return getPath(STEP_SUBMITTED, request, data);
  },
  [STEP_METER_DETAILS]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    const isSingleTotal = get(data, 'reading.totalFlag', false);

    let next;
    if (isVolumes) {
      next = isSingleTotal ? STEP_CONFIRM : STEP_QUANTITIES;
    } else {
      next = STEP_METER_UNITS;
    }
    return getPath(next, request, data);
  },
  [STEP_METER_UNITS]: (request, data) => {
    return getPath(STEP_METER_READINGS, request, data);
  },
  [STEP_METER_READINGS]: (request, data) => {
    return getPath(STEP_CONFIRM, request, data);
  }
};

const previous = {
  [STEP_START]: (request) => {
    const isInternal = request.permissions.hasPermission('admin.defra');
    return isInternal ? '/admin/licences' : '/returns';
  },
  [STEP_NIL_RETURN]: (request, data) => {
    return getPath(STEP_START, request, data);
  },
  [STEP_METHOD]: (request, data) => {
    return getPath(STEP_START, request, data);
  },
  [STEP_UNITS]: (request, data) => {
    return getPath(STEP_METHOD, request, data);
  },
  [STEP_SINGLE_TOTAL]: (request, data) => {
    return getPath(STEP_UNITS, request, data);
  },
  [STEP_BASIS]: (request, data) => {
    const isInternal = request.permissions.hasPermission('admin.defra');
    return getPath(isInternal ? STEP_SINGLE_TOTAL : STEP_UNITS, request, data);
  },
  [STEP_QUANTITIES]: (request, data) => {
    const isMeasured = get(data, 'reading.type') === 'measured';
    return getPath(isMeasured ? STEP_METER_DETAILS : STEP_BASIS, request, data);
  },
  [STEP_CONFIRM]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    return getPath(isVolumes ? STEP_QUANTITIES : STEP_METER_READINGS, request, data);
  },
  [STEP_METER_DETAILS]: (request, data) => {
    const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
    return getPath(isVolumes ? STEP_BASIS : STEP_METHOD, request, data);
  },
  [STEP_METER_UNITS]: (request, data) => {
    return getPath(STEP_METER_DETAILS, request, data);
  },
  [STEP_METER_READINGS]: (request, data) => {
    return getPath(STEP_METER_UNITS, request, data);
  }
};

/**
 * Gets the next step in the flow based on the current step and variables
 * @param {String} current - current step in flow
 * @param {Object} request - HAPI request instance
 * @param {Object} data - the return model data
 */
const getNextPath = (current, request, data) => {
  return next[current](request, data);
};

/**
 * Gets the previous step in the flow based on the current step and variables
 * @param {String} current - current step in flow
 * @param {Object} request - HAPI request instance
 * @param {Object} data - the return model data
 */
const getPreviousPath = (current, request, data) => {
  return previous[current](request, data);
};

module.exports = {
  STEP_START,
  STEP_NIL_RETURN,
  STEP_METHOD,
  STEP_UNITS,
  STEP_SINGLE_TOTAL,
  STEP_BASIS,
  STEP_QUANTITIES,
  STEP_METER_DETAILS,
  STEP_METER_UNITS,
  STEP_METER_READINGS,
  STEP_CONFIRM,
  getPath,
  getNextPath,
  getPreviousPath
};
