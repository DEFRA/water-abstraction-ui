const moment = require('moment');
const { extractLicenceNumbers } = require('../licence-helpers');

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
 * Boolean mapper - maps a boolean value to a string 'true' or 'false'
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

const numberMapper = {
  import: (fieldName, payload) => {
    const value = payload[fieldName];
    if (value === '') {
      return null;
    }
    if (!isNaN(value)) {
      return parseFloat(value);
    }
    return value;
  },
  export: (value) => {
    return value;
  }
};

/**
 * Delimited mapper - for a pasted set of licence numbers, splits string on common
 * delimiters , newlines, tabs, semicolon
 */
const licenceNumbersMapper = {
  import: (fieldName, payload) => {
    return extractLicenceNumbers(payload[fieldName]);
  },
  export: (value) => {
    return value.join(', ');
  }
};

module.exports = {
  defaultMapper,
  booleanMapper,
  dateMapper,
  numberMapper,
  licenceNumbersMapper
};
