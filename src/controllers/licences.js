/**
 * HAPI Route handlers for viewing and managing licences
 * @module controllers/licences
 */
const Boom = require('boom');
const BaseJoi = require('joi');

const CRM = require('../lib/connectors/crm');
const View = require('../lib/view');
const Permit = require('../lib/connectors/permit');
const errorHandler = require('../lib/error-handler');

const joiProfanityExtension = require('../lib/joi-profanity');
const Joi = BaseJoi.extend(joiProfanityExtension);
const {licenceRoles, licenceCount} = require('../lib/licence-helpers');



/**
 * Gets a list of licences with options to filter by email address,
 * Search by licence number, and sort by number/user defined name
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.emailAddress] - the email address to filter on
 * @param {String} [request.query.licenceNumber] - the licence number to search on
 * @param {String} [request.query.sort] - the field to sort on licenceNumber|name
 * @param {Number} [request.query.direction] - sort direction +1 : asc, -1 : desc
 * @param {Object} reply - the HAPI HTTP response
 */
function getLicences(request, reply) {

  const viewContext = View.contextDefaults(request);

  const { entity_id } = request.auth.credentials;

  // Get filtered list of licences
  const filter = {
    entity_id,
    string : request.query.licenceNumber,
    email : request.query.emailAddress
  };

  // Sorting
  const sortFields= {licenceNumber : 'system_external_id', name : 'document_custom_name'};
  const sortField = request.query.sort || 'licenceNumber';
  const direction = request.query.direction === -1 ? -1 : 1;
  const sort = {};
  sort[sortFields[sortField]] = direction;

  // Set sort info on viewContext
  viewContext.direction = direction;
  viewContext.sort = sortField;

  CRM.getLicences(filter, sort)
    .then((response) => {

      if(response.err) {
        throw Boom.badImplementation('CRM error', response);
      }

      const { data, summary } = response;

      // Render HTML page
      viewContext.licenceData = data
      viewContext.debug.licenceData = data
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'


      // Calculate whether to display email filter / search form depending on summary
      const userRoles = licenceRoles(summary);
      viewContext.licenceCount = licenceCount(summary);
      viewContext.showEmailFilter = userRoles.admin || userRoles.agent;
      viewContext.enableSearch = viewContext.licenceCount  > 5; // @TODO confirm with design team

      return reply.view('water/licences', viewContext)
    })
    .catch(errorHandler(request, reply));

}


/**
 * Renders a licence page with one of several different views
 * @param {String} view - the template to load
 * @param {String} pageTitle - custom page title for this view
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 * @param {Object} [context] - additional view context data
 */
function renderLicencePage(view, pageTitle, request, reply, context = {}) {

  const { entity_id } = request.auth.credentials;

  const viewContext = Object.assign({}, View.contextDefaults(request), context);

  viewContext.pageTitle = pageTitle

  // Get filtered list of licences
  const filter = {
    entity_id,
    document_id : request.params.licence_id
  };

  CRM.getLicences(filter)
    .then((response) => {

      if(response.err) {
        throw Boom.badImplementation(`CRM error`, response);
      }
      if(response.data.length != 1) {
        throw new Boom.notFound('Document not found in CRM', response);
      }

      // Output CRM data in addition to permit repository data to view
      viewContext.crmData = response.data[0];

      // Get permit
      return Permit.getLicence(response.data[0].system_internal_id);

    })
    .then((response) => {

      const data = JSON.parse(response.body)
      viewContext.licence_id = request.params.licence_id
      viewContext.licenceData = data.data
      viewContext.debug.licenceData = viewContext.licenceData
      viewContext.name = 'name' in viewContext ? viewContext.name : viewContext.crmData.document_custom_name;
      return reply.view(view, viewContext)
    })
    .catch(errorHandler(request, reply));
}

function getLicence(request, reply) {

  renderLicencePage(
    'water/licence', 'GOV.UK - Your water abstraction licences', request, reply
  )
}

function getLicenceContact(request, reply) {
  renderLicencePage(
    'water/licences_contact', 'GOV.UK - Your water abstraction licences - contact details', request, reply
  )
}

function getLicenceMap(request, reply) {
  renderLicencePage(
    'water/licences_map', 'GOV.UK - Your water abstraction licences - Map', request, reply
  )
}

function getLicenceTerms(request, reply) {
  renderLicencePage(
    'water/licences_terms', 'GOV.UK - Your water abstraction licences - Full Terms', request, reply
  )
}

function getLicenceRename(request, reply, context = {}) {
  renderLicencePage(
    'water/licences_rename', 'GOV.UK - Your water abstraction licences - Rename', request, reply, context
  )
}


/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
function postLicence(request, reply) {

  const { name } = request.payload;
  const { entity_id } = request.auth.credentials;

  // Prepare filter for filtering licence list from CRM
  const filter = {
    entity_id,
    document_id : request.params.licence_id
  };

  // Validate supplied licence name
  const schema = {
    name : Joi.string().trim().required().min(2).max(32).regex(/^[a-z0-9 ']+$/i).profanity()
  };
  const {error, value} = Joi.validate({name}, schema, {abortEarly : false});
  if(error) {
      return getLicenceRename(request, reply, {error, name : request.payload.name });
  }

  CRM.getLicences(filter)
    .then((response) => {

      if(!response || response.err) {
        throw new Boom.badImplementation('CRM error', response);
      }

      if(response.data.length !== 1) {
        throw new Boom.notFound('Document not found in CRM');
      }

      // Get the document ID from the returned CRM data
      const { document_id, system_internal_id } = response.data[0];

      // Udpate licence name in CRM
      return CRM.setLicenceName(document_id, value.name);
    })
    .then((response) => {
      // Licence updated - redirect to licence view
      reply.redirect(`/licences/${ request.params.licence_id }`);
    })
    .catch(errorHandler(request, reply));

}


module.exports = {
  getLicences,
  getLicence,
  postLicence,
  getLicenceContact,
  getLicenceMap,
  getLicenceTerms,
  getLicenceRename
};
