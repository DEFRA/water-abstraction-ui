const moment = require('moment');
const Boom = require('boom');
const { isObject } = require('lodash');
const SharedReturnsApiClient = require('shared/lib/connectors/services/returns/ReturnsApiClient');

/**
 * Gets the filter to use for retrieving licences from returns service
 * @param {Array} licenceNumbers
 * @param {Boolean} showFutureReturns
 * @return {Object} filter
 */
const getLicenceReturnsFilter = (licenceNumbers, showFutureReturns = false) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: {
      $in: licenceNumbers
    },
    start_date: {
      $gte: '2008-04-01'
    },
    end_date: {
      $lte: moment().format('YYYY-MM-DD')
    },
    'metadata->>isCurrent': 'true',
    status: { $ne: 'void' }
  };

  // External users on production-like environments can only view returns where
  // return cycle is in the past
  if (showFutureReturns) {
    delete filter.end_date;
  }

  return filter;
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
   * @param {Number|Object} page number, or pagination object
   * @return {Promise} resolves with returns
   */
  async getLicenceReturns (licenceNumbers, page = 1) {
    const filter = getLicenceReturnsFilter(licenceNumbers, this.showFutureReturns);

    const sort = {
      start_date: -1,
      licence_ref: 1
    };

    const columns = [
      'return_id', 'licence_ref', 'start_date', 'end_date', 'metadata',
      'status', 'received_date', 'due_date', 'return_requirement'
    ];

    const pagination = getPagination(page);

    const response = await this.findMany(filter, sort, pagination, columns);
    if (response.error) {
      throw Boom.badImplementation('Returns error', response.error);
    }

    return response;
  };
}

module.exports = ReturnsApiClient;
