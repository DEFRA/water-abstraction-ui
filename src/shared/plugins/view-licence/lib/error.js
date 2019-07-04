const Boom = require('boom');

/**
 * Generates Boom error if required
 * @param {Object} error
 * @return {Object} error
 */
function errorMapper (error) {
  if (error.statusCode === 404) {
    return Boom.notFound(error);
  }
  if (error.name === 'LicenceNotFoundError') {
    return Boom.notFound('Licence not found', error);
  }
  return error;
}

exports.errorMapper = errorMapper;
