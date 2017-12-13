
/**
 * HAPI Route handlers for registering a user account
 * @module controllers/registration
 */
const Boom = require('boom');
const Joi = require('joi');
const errorHandler = require('../lib/error-handler');
const View = require('../lib/view');
const joiPromise = require('../lib/joi-promise');
const IDM = require('../lib/connectors/idm');
const CRM = require('../lib/connectors/crm');

/**
 * Render form to add licences to account
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getLicenceAdd(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Add Licence';
  return reply.view('water/licences-add/add-licences', viewContext);
}

/**
 * A function to extract an array of licence numbers from a string
 * @param {String} str - a string containing licence numbers
 * @return {Array} - array of unqiue matched licence numbers
 */
function _extractLicenceNumbers(str) {
  // Licence regex and array of matches
  const r = /[a-z0-9]+(\/[a-z0-9]+){3}/ig, licenceNumbers = [];
  while(matches = r.exec(str)) {
    licenceNumbers.push(matches[0]);
  }
  // Return unique values
  // @see {@link https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates}
  return licenceNumbers.filter((v, i, a) => a.indexOf(v) === i);
}


/**
 * Post handler for adding licences
 * Need to:
 * - extract licence numbers from supplied text
 * - get licence numbers from CRM
 * - Check address / licence holder name consistency
 * - create verification step
 */
function postLicenceAdd(request, reply) {

  const viewContext = View.contextDefaults(request);

  // Get unique list of licence numbers
  const licenceNumbers = _extractLicenceNumbers(request.payload.licence_no);

  if(licenceNumbers.length < 1) {
    viewContext.pageTitle = 'GOV.UK - Add Licence';
    viewContext.error = {name : 'ValidationError'};
    return reply.view('water/licences-add/add-licences', viewContext);
  }
}

module.exports = {
  getLicenceAdd,
  postLicenceAdd
};
