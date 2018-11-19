const returnsService = require('../../../lib/connectors/returns');
const helpers = require('../lib/helpers');
const { documents } = require('../../../lib/connectors/crm');

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

  return {filter, sort, pagination, columns};
};

class ReturnAPIError extends Error {
  constructor (...args) {
    super(...args);
    Error.captureStackTrace(this, ReturnAPIError);
  }
}

/**
 * Filters row from return service.
 * If an error is present, an error is thrown.
 * Otherwise the first element of the returned array is returned
 * @param {Object} row - data returned from return service API call
 * @return {Object} single return row data
*/
const filterReturn = (row) => {
  if (row.error) {
    throw ReturnAPIError(row.error);
  }
  return row.data[0];
};

/**
 * Gets recent returns for a given format ID for every region code
 * @param {String} formatId
 * @return {Promise} resolves when all regions have been searched
 */
const getRecentReturnsByFormatId = async (formatId) => {
  const regions = [1, 2, 3, 4, 5, 6, 7, 8];

  const tasks = regions.map(regionCode => {
    const { filter, sort, pagination, columns } = findLatestReturn(formatId, regionCode);
    return returnsService.returns.findMany(filter, sort, pagination, columns);
  });

  const returns = await Promise.all(tasks);

  // Map and filter returned data
  return returns.map(filterReturn).filter(x => x);
};

class CRMDocumentsAPIError extends Error {
  constructor (...args) {
    super(...args);
    Error.captureStackTrace(this, ReturnAPIError);
  }
}

/**
 * Given an array of returns, checks each licence number
 * exists in CRM
 * @param {Array} returns
 * @return {Promise} resolves with list of returns filtered by whether
 *                   they exist in the CRM document headers
 */
const filterReturnsByCRMDocument = async (returns) => {
  const licenceNumbers = returns.map(row => row.licence_ref);
  const filter = {
    system_external_id: {
      $in: licenceNumbers
    }
  };
  const { data, error } = await documents.findMany(filter);

  if (error) {
    throw CRMDocumentsAPIError(error);
  }

  const validLicenceNumbers = data.map(row => row.system_external_id);

  return returns.filter(row => validLicenceNumbers.includes(row.licence_ref));
};

/**
 * Finds returns by format ID in each region, then filters them by whether
 * they have a current CRM doc header
 * @param {String} formatId
 * @return {Promise} resoves with an array of basic returns API row data
 */
const findLatestReturnsByFormatId = async (formatId) => {
  const returns = await getRecentReturnsByFormatId(formatId);
  return filterReturnsByCRMDocument(returns);
};

/**
 * Given a return ID (NALD format ID), gets the return from the returns
 * service, and also checkes the document header in the CRM
 * @param {String} formatId
 * @param {String} entityId - the current user individual entity ID
 * @return {Promise} resolves with return data
 */
const getRecentReturnByFormatId = async (formatId, entityId) => {
  const { filter, sort, pagination, columns } = findLatestReturn(formatId);
  const { data: [ret] } = await returnsService.returns.findMany(filter, sort, pagination, columns);

  if (ret) {
    // Load CRM doc header - this checks the licence version is current
    const [ documentHeader ] = await helpers.getLicenceNumbers(entityId, {system_external_id: ret.licence_ref}, true);

    if (documentHeader) {
      return ret;
    }
  }
};

module.exports = {
  findLatestReturn,
  getRecentReturnByFormatId,
  getRecentReturnsByFormatId,
  filterReturnsByCRMDocument,
  findLatestReturnsByFormatId
};
