const { isObject } = require('lodash');
const Boom = require('@hapi/boom');
const SharedReturnsApiClient = require('shared/lib/connectors/services/returns/ReturnsApiClient');

/**
 * Gets the filter to use for retrieving licences from returns service
 * @param {Array} licenceNumbers
 * @return {Object} filter
 */
const getLicenceReturnsFilter = (licenceNumbers) => {
  return {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: {
      $in: licenceNumbers
    },
    start_date: {
      $gte: '2008-04-01'
    }
  };
};

const getPagination = page => {
  return isObject(page) ? page : {
    page,
    perPage: 50
  };
};

class ReturnsApiClient extends SharedReturnsApiClient {
  /**
   * Get the returns for a list of licence numbers
   * @param {Array} list of licence numbers to get returns data for
   * @return {Promise} resolves with returns
   */
  async getLicenceReturns (licenceNumbers, page = 1) {
    const filter = getLicenceReturnsFilter(licenceNumbers);

    const sort = {
      start_date: -1,
      licence_ref: 1
    };

    const columns = [
      'return_id', 'licence_ref', 'start_date', 'end_date', 'metadata',
      'status', 'received_date', 'due_date', 'return_requirement'
    ];

    const requestPagination = getPagination(page);

    const response = await this.findMany(filter, sort, requestPagination, columns);
    if (response.error) {
      throw Boom.badImplementation('getLicenceReturns error', response.error);
    }

    return response;
  };
}

module.exports = ReturnsApiClient;
