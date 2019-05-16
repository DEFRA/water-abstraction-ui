const moment = require('moment');
const { licenceNumbersMapper } = require('../../../../shared/lib/forms/mappers');

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
    if (value) {
      const m = moment(value, 'YYYY-MM-DD');
      return m.format('D MMMM YYYY');
    }
    return null;
  }
};

/**
 * Replaces the text so that each part of the address is displayed
 * on the next line. Swaps \r for a double space ('  ')
 */
const addressMapper = {
  import: (fieldName, payload) => payload[fieldName],
  export: (value = '') => value.replace(/\r/g, '  ')
};

module.exports = {
  defaultMapper,
  licenceNumbersMapper,
  dateMapper,
  addressMapper
};
