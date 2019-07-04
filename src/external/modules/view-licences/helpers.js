/**
 * Maps the sort in the HTTP query to the field names used internally
 * @param {Object} sort - the sorting in query, field name and direction
 * @return {Object} sort ready for use in getLicences CRM request
 */
function mapSort (sort) {
  const sortFields = {
    licenceNumber: 'system_external_id',
    name: 'document_name',
    expiryDate: 'document_expires'
  };
  return {
    [sortFields[sort.sort]]: sort.direction
  };
}

/**
 * Maps the sort in the HTTP query to the filter used internally
 * @param {Object} query - the HTTP query params
 * @return {Object} sort ready for use in getLicences CRM request
 */
function mapFilter (companyId, query) {
  const filter = {
    company_entity_id: companyId
  };
  // Search on licence name/number
  if (query.licenceNumber) {
    filter.string = query.licenceNumber.trim();
  }
  // Search on user email address
  if (query.emailAddress) {
    filter.email = query.emailAddress.trim();
  }
  return filter;
}

exports.mapSort = mapSort;
exports.mapFilter = mapFilter;
