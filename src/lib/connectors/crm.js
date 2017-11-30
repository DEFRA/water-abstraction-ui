/**
 * Provides convenience methods for HTTP API requests from the tactical CRM
 * @module lib/connectors/crm
 */
const rp = require('request-promise-native').defaults({
    proxy:null,
    strictSSL :false
  })

/**
 * Get entity record
 * @param {String} user_name - the email address of the current user
 * @return {Promise} resolves with user entity record
 * @example getEntity('mail@example.com').then((response) => { // response.data });
 */
function getEntity(user_name) {
  var uri = process.env.CRM_URI + '/entity/' + user_name + '?token=' + process.env.JWT_TOKEN
  return rp({
    uri,
    method : 'GET',
    json : true
  });
}

/**
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence lisrt
 * @param {String} [filter.entity_id] - the current user's entity ID
 * @param {String} [filter.email] - the email address to search on
 * @param {String} [filter.string] - the search query, can be licence number, user-defined name etc.
 * @param {Object} [sort] - fields to sort on
 * @param {Number} [sort.licenceNumber] - sort on licence number, +1 : asc, -1 : desc
 * @param {Number} [sort.name] - sort on licence name, +1 : asc, -1 : desc
 * @return {Promise} resolves with array of licence records
 * @example getLicences({entity_id : 'guid'})
 */
function getLicences(filter, sort = {}) {
  const uri = process.env.CRM_URI + '/documentHeader/filter?token=' + process.env.JWT_TOKEN;
  return rp({
    uri,
    method : 'POST',
    json : true,
    body : { filter, sort }
  });
}


function getLicenceInternalID(licences, document_id) {
  /**this function gets the internal ID (i.e. the ID of the licence in the permit repository) from the document_id
  (from the CRM document header record) which can then be used to retrieve the full licence from the repo **/
  return new Promise((resolve, reject) => {
    var thisLicence = licences.find(x => x.document_id === document_id)
    if (thisLicence) {
      resolve(thisLicence)
    } else {
      reject('Licence with ID ' + document_id + ' could not be found.')
    }
  })
}

module.exports = {
  getEntity,
  getLicences,
  getLicenceInternalID: getLicenceInternalID

}
