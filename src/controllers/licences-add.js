
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
const uniq = require('lodash/uniq');


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
 * A function to extract an array of licence numbers from a user-supplied string
 * @param {String} str - a string containing licence numbers
 * @return {Array} - array of unqiue matched licence numbers
 */
function _extractLicenceNumbers(str) {
  // Return unique values
  // @see {@link https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates}
  return str
    .split(/[^a-z0-9\/]+/ig)
    .filter(s => s)
    .filter((v, i, a) => a.indexOf(v) === i);
}


/**
 * A function to check whether an array of returned licences are similar
 * this is defined for now as:
 * - if only 1 licence supplied, always passes
 * - names and postcodes are sanitized
 * - a unique list of names and postcodes is generated
 * - if all licences have same postcode or name, passes
 * - if there are no more than 3 unique names and postcodes
 * - otherwise fails
 * @param {Array} licences - array of licences returned from DB
 * @return {Boolean} - whether licences pass similarity test
 */
function _checkLicenceSimilarity(licences) {
  if(licences.name < 2) {
    return true;
  }
  const sanitize = (x) => {
    x = x.trim();
    x = x.replace('&', 'AND');
    x = x.replace(/[^a-z0-9]/ig, '');
    x = x.toLowerCase();
    return x;
  };
  const names = uniq(licences.map((licence) => {
    return sanitize(licence.document_original_name);
  }));
  const postcodes = uniq(licences.map((licence) => {
    return sanitize(licence.document_postcode);
  }));
  if(names.length === 1 || postcodes.length === 1) {
    return true;
  }
  return (names.length + postcodes.length) <= 3;
}




/**
 * Post handler for adding licences
 * Need to:
 * - extract licence numbers from supplied text
 * - get licence numbers from CRM
 * - Check address / licence holder name consistency
 * - create verification step
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - form POST
 * @param {String} request.payload.licence_no - user-entered licence numbers
 * @param {Object} reply - HAPI HTTP reply
 */
function postLicenceAdd(request, reply) {

  // @TODO handle error conditions:
  // Not all licences matched
  // None found
  // Disparity between licence data

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Add Licence';

  // Get list of licence numbers from supplied data
  const licenceNumbers = _extractLicenceNumbers(request.payload.licence_no);

  // Validate posted data
  const schema = {
    licence_no : Joi.string().required().allow('').max(6000)
  };
  joiPromise(request.payload, schema)
    .then((value) => {
      // Extract licence numbers from string
      if(licenceNumbers.length < 1) {
        throw {name : 'ValidationError'};
      }
      // Get unverified licences from DB
      return CRM.getLicences({ system_external_id : licenceNumbers, verified : null });
    })
    .then((res) => {

      // Check 1+ licences found
      if(res.data.length < 1) {
        throw {name : 'ValidationError'};
      }

      // Check # of licences returned = that searched for
      if(res.data.length != licenceNumbers.length) {
        throw {name : 'ValidationError'};
      }

      // Check licences are similar
      const similar = _checkLicenceSimilarity(res.data);
      if(!similar) {
        throw {name : 'ValidationError'};
      }

      viewContext.licences = res.data;
      return reply.view('water/licences-add/select-licences', viewContext);
    })
    .catch((err) => {
      if(err.name === 'ValidationError') {
        viewContext.error = err;
        return reply.view('water/licences-add/add-licences', viewContext);
      }
      throw err;
    })
    .catch(errorHandler(request, reply));


}

module.exports = {
  getLicenceAdd,
  postLicenceAdd
};
