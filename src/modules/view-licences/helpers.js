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
function mapFilter (entityId, query) {
  const filter = {
    entity_id: entityId
  };
  // Search on licence name/number
  if (query.licenceNumber) {
    filter.string = query.licenceNumber;
  }
  // Search on user email address
  if (query.emailAddress) {
    filter.email = query.emailAddress;
  }
  return filter;
}

/**
 * Gets the licence page title based on the view, licence number and custom title
 * @param {String} view - the handlebars view
 * @param {String} licenceNumber - the licence number
 * @param {String} [customTitle] - if set, the custom name given by user to licence
 * @return {String} page title
 */
function getLicencePageTitle (view, licenceNumber, customName) {
  if (view === 'water/view-licences/purposes') {
    return `Abstraction details for ${customName || licenceNumber}`;
  }
  if (view === 'water/view-licences/points') {
    return `Abstraction points for ${customName || licenceNumber}`;
  }
  if (view === 'water/view-licences/conditions') {
    return `Conditions held for ${customName || licenceNumber}`;
  }
  if (view === 'water/view-licences/contact') {
    return 'Your licence contact details';
  }
  // Default view/rename
  return customName ? `Licence name ${customName}` : `Licence number ${licenceNumber}`;
}

module.exports = {
  mapSort,
  mapFilter,
  getLicencePageTitle
};
