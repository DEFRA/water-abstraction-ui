const moment = require('moment');

/**
 * Default mapper - simply extracts the value of the named field
 */
const defaultMapper = {
  import: (fieldName, payload) => {
    return payload[fieldName];
  },
  export: (value) => {
    return value;
  }
};

/**
 * Boolean mapper - simply extracts the value of the named field
 */
const booleanMapper = {
  import: (fieldName, payload) => {
    const value = payload[fieldName];
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return undefined;
  },
  export: (value) => {
    if (value === true) {
      return 'true';
    }
    if (value === false) {
      return 'false';
    }
    return undefined;
  }
};

/**
 * Date mapper - combines the day month and year form values to a single
 * string formatted as YYYY-MM-DD
 */
const dateMapper = {
  import: (fieldName, payload) => {
    const day = payload[fieldName + '-day'];
    const month = payload[fieldName + '-month'];
    const year = payload[fieldName + '-year'];
    const m = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    return m.isValid() ? m.format('YYYY-MM-DD') : undefined;
  },
  export: (value) => {
    const m = moment(value, 'YYYY-MM-DD');

    if (m.isValid()) {
      return {
        date: m.date(),
        month: m.month() + 1,
        year: m.year()
      };
    } else {
      return {
        date: null,
        month: null,
        year: null
      };
    }
  }
};

module.exports = {
  defaultMapper,
  booleanMapper,
  dateMapper
};
