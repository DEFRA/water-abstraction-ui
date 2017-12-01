/**
 * Route handlers for viewing and managing licences
 * @module controllers/licences
 */
const CRM = require('../lib/connectors/crm');
const View = require('../lib/view');
const Permit = require('../lib/connectors/permit')

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

  // Get entity record from CRM for current user
  CRM.getEntity(request.session.username)
    .then((response) => {

      // Get the entity ID for the current user from CRM response
      const { entity_id, entity_type } = response.data.entity;

      // Get filtered list of licences
      const filter = {
        entity_id,
        string : request.query.licenceNumber,
        email : request.query.emailAddress
      };

      // Sorting
      const sortFields= {licenceNumber : 'document_id', name : 'name'};
      const sortField = request.query.sort || 'licenceNumber';
      const direction = request.query.direction === -1 ? -1 : 1;
      const sort = {};
      sort[sortFields[sortField]] = direction;

      // Set sort info on viewContext
      viewContext.direction = direction;
      viewContext.sort = sortField;

      // @TODO check valid role names
      viewContext.showEmailFilter = ['agent', 'admin'].includes(entity_type);

      return CRM.getLicences(filter, sort);
    })
    .then((response) => {

      const { data } = response;

      // Render HTML page
      viewContext.licenceData = data
      viewContext.debug.licenceData = data
      viewContext.pageTitle = 'GOV.UK - Your water abstraction licences'

      // @TODO confirm number of records to display search form
      viewContext.enableSearch = data.length > 5;

      return reply.view('water/licences', viewContext)
    })
    .catch((err) => {

      console.log(err);

      var viewContext = View.contextDefaults(request)
      viewContext.pageTitle = 'GOV.UK - Error'
      return reply.view('water/error', viewContext).code(500);
    });

}


/**
 * Renders a licence page with one of several different views
 * @param {String} view - the template to load
 * @param {String} pageTitle - custom page title for this view
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} reply - the HAPI HTTP response
 */
function renderLicencePage(view, pageTitle, request, reply) {
  var viewContext = View.contextDefaults(request)
  viewContext.pageTitle = pageTitle

  // @TODO check with dave re. redirect to login if not auth
  // if (!viewContext.session.id) {
  //   getSignin(request, reply)
  // } else {

  // Get entity record from CRM for current user
  CRM.getEntity(request.session.username)
    .then((response) => {

      // Get the entity ID for the current user from CRM response
      const { entity_id } = response.data.entity;

      // Get filtered list of licences
      const filter = {
        entity_id,
        document_id : request.params.licence_id
      };

      return CRM.getLicences(filter);
    })
    .then((response) => {

      if(response.data.length != 1) {
        throw new Error('You have requested a licence with an invalid ID');
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
      return reply.view(view, viewContext)
    })
    .catch((err) => {

      console.log(err);

      viewContext.debug.response = err
      viewContext.error = err
      return reply.view('water/404', viewContext).code(404);
    })

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


/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
function postLicence(request, reply) {
  console.log(request.payload.name);
  // Get entity record from CRM for current user
  CRM.getEntity(request.session.username)
    .then((response) => {

      // Get the entity ID for the current user from CRM response
      const { entity_id } = response.data.entity;

      // Get filtered list of licences
      const filter = {
        entity_id,
        document_id : request.params.licence_id
      };

      return CRM.getLicences(filter);
    })
    .then((response) => {
      // Udpate licence name in CRM
      return CRM.setLicenceName(request.params.licence_id, request.payload.name);
    })
    .then(() => {
      // Updated - redirect to licence view
      reply.redirect(`/licences/${ request.params.licence_id }`);
    })
    .catch((err) => {
      console.log(err);
      reply(err);
    });

}


module.exports = {
  getLicences,
  getLicence,
  postLicence,
  getLicenceContact,
  getLicenceMap,
  getLicenceTerms
};
