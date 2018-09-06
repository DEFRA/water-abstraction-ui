const moment = require('moment');

/**
 * @see {@link https://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax-babel}
 */
class ExtendableError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }
}

class ValidationError extends ExtendableError {};

/**
 * Checks request has a 'filter' query param which is valid JSON
 * @param {Object} request - HAPI request instance
 */
const validateRequest = (request) => {
  let filter;
  try {
    filter = JSON.parse(request.query.filter);
  } catch (error) {
    throw new ValidationError('Invalid filter JSON in query params');
  }

  return filter;
};

/**
 * Maps a row of return line data to the format expected by the ETL process
 * @param {Object} row
 * @return {Object}
 */
const mapLine = (row) => {
  const qty = Math.round(10000 * Math.random());
  const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
  return {
    ...row,
    RET_QTY: qty.toString(),
    updated_at: updatedAt
  };
};

/**
 * Maps a row of return form log data to the format expected by the ETL process
 * @param {Object} row
 * @return {Object}
 */
const mapLog = (row) => {
  const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
  const dateReceived = moment().subtract(1, 'day').format('DD/MM/YYYY');
  return {
    ...row,
    RECD_DATE: dateReceived,
    updated_at: updatedAt
  };
};

module.exports = {
  validateRequest,
  mapLine,
  mapLog
};
