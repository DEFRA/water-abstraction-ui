const ExtendableError = require('es6-error');
const services = require('../../../lib/connectors/services');
const { isReturnId } = require('shared/lib/returns/strings');

class ReturnAPIError extends ExtendableError {};

/**
 * Creates the required params to send to the return service to get the
 * latest return for a specified format ID
 * @param {String} formatId
 * @param {String} regionCode - the NALD region code
 * @return {Object} contains filter, sort, pagination, columns
 */
const findLatestReturn = (formatId, regionCode) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    return_requirement: formatId,
    'metadata->nald->regionCode': parseInt(regionCode)
  };

  const pagination = {
    perPage: 1,
    page: 1
  };

  const sort = {
    end_date: -1
  };

  const columns = ['return_id', 'status', 'licence_ref', 'return_requirement'];

  return { filter, sort, pagination, columns };
};

/**
 * Filters row from return service.
 * If an error is present, an error is thrown.
 * Otherwise the first element of the returned array is returned
 * @param {Object} row - data returned from return service API call
 * @return {Object} single return row data
*/
const filterReturn = (row) => {
  if (row.error) {
    throw new ReturnAPIError(row.error);
  }
  return row.data[0];
};

/**
 * Gets recent returns for a given format ID for every region code
 * @param {String} str - formatId or return ID
 * @return {Promise} resolves when all regions have been searched
 */
const getRecentReturns = async (str) => {
  // For QR code support, we check whether the supplied value is a full
  // return ID
  if (isReturnId(str)) {
    const { data, error } = await services.returns.returns.findOne(str);
    if (error) {
      throw new ReturnAPIError(`Error getting return ${str} from returns API`, error);
    }
    return [data];
  }

  const regions = [1, 2, 3, 4, 5, 6, 7, 8];

  const tasks = regions.map(regionCode => {
    const { filter, sort, pagination, columns } = findLatestReturn(str, regionCode);
    return services.returns.returns.findMany(filter, sort, pagination, columns);
  });

  const returns = await Promise.all(tasks);

  // Map and filter returned data
  return returns.map(filterReturn).filter(x => x);
};

exports.findLatestReturn = findLatestReturn;
exports.getRecentReturns = getRecentReturns;
exports.filterReturn = filterReturn;
