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

module.exports = {
  findLatestReturn
};
