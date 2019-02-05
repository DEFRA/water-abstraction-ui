const { throwIfError } = require('@envage/hapi-pg-rest-api');
const returns = require('../../../lib/connectors/returns');

/**
 * Gets recent returns (in most return cycle) for given licence number
 * @param  {String}  licenceNumber - the licence to find recent returns for
 * @param  {Boolean} isInternal    - whether internal user
 * @return {Promise}               - resolves with returns
 */
const getLicenceReturns = async (licenceNumber, isInternal) => {
  const filter = {
    licence_ref: licenceNumber
  };
  if (!isInternal) {
    filter.status = {
      $ne: 'void'
    };
  }
  const sort = {
    end_date: -1
  };
  const pagination = {
    perPage: 10,
    page: 1
  };
  const { error, data } = await returns.returns.findMany(filter, sort, pagination);
  throwIfError(error);
  return data;
};

module.exports = {
  getLicenceReturns
};
