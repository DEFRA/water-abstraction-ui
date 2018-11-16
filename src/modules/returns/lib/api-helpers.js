const returnsService = require('../../../lib/connectors/returns');
const helpers = require('../lib/helpers');

/**
 * Creates the required params to send to the return service to get the
 * latest return for a specified format ID
 * @param {String} formatId
 * @return {Object} contains filter, sort, pagination, columns
 */
const findLatestReturn = (formatId) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    return_requirement: formatId
  };

  const pagination = {
    perPage: 1,
    page: 1
  };

  const sort = {
    end_date: -1
  };

  const columns = ['return_id', 'status', 'licence_ref'];

  return {filter, sort, pagination, columns};
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
  getRecentReturnByFormatId
};
