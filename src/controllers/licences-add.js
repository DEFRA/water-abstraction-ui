
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

const {checkLicenceSimilarity, extractLicenceNumbers} = require('../lib/licence-helpers');

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
  const licenceNumbers = extractLicenceNumbers(request.payload.licence_no);

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
      const similar = checkLicenceSimilarity(res.data);
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
