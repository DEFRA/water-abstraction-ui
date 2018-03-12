/**
 * HAPI Route handlers for viewing and managing licences
 * @module controllers/licences
 */

/* eslint "new-cap" : ["warn", { "newIsCap": true }] */
const Boom = require('boom');
const CRM = require('../lib/connectors/crm');
const IDM = require('../lib/connectors/idm');
const View = require('../lib/view');
const Permit = require('../lib/connectors/permit');
const errorHandler = require('../lib/error-handler');
const LicenceTransformer = require('../lib/licence-transformer/');

const {licenceRoles, licenceCount} = require('../lib/licence-helpers');
const Joi = require('joi');

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
async function getLicences (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.activeNavLink = 'view';

  const { entity_id: entityId } = request.auth.credentials;
  let filter = {};

  if (request.permissions && request.permissions.admin.defra) {
    filter = {
      entity_id: entityId,
      string: request.query.licenceNumber,
      email: request.query.emailAddress
    };

    if (filter.email) {
      delete filter.entity_id;
    }

    if (!filter.string && !filter.email) {
      // if admin user and no search params entered, don't show search results
      viewContext.showAdminIntro = true;
      viewContext.showResults = false;
      viewContext.licenceData = null;
      viewContext.enableSearch = true;
      viewContext.showEmailFilter = true;
      return reply.view('water/licences_admin', viewContext);
    } else {
      viewContext.enableSearch = true;
      viewContext.showEmailFilter = true;
      viewContext.showAdminIntro = true;
      viewContext.showResults = true;
    }
  } else {
    viewContext.showResults = true;
    // Get filtered list of licences
    filter = {
      entity_id: entityId,
      string: request.query.licenceNumber,
      email: request.query.emailAddress
    };
  }

  // Current page of results - for paginated result set
  const page = request.query.page || 1;

  // Sorting
  const sortFields = {licenceNumber: 'system_external_id', name: 'document_custom_name'};
  const sortField = request.query.sort || 'licenceNumber';
  const direction = request.query.direction === -1 ? -1 : 1;
  const sort = {};
  sort[sortFields[sortField]] = direction;

  // Set sort info on viewContext
  viewContext.direction = direction;
  viewContext.sort = sortField;

  // Validate email address
  const schema = {
    emailAddress: Joi.string().allow('').email(),
    licenceNumber: Joi.string().allow(''),
    sort: Joi.string().allow(''),
    direction: Joi.number(),
    page: Joi.number()
  };
  const {error, value} = Joi.validate(request.query, schema);
  if (error) {
    viewContext.error = error;
  }
  try {
    // Look up user for email filter
    if (value.emailAddress && !error) {
      try {
        await IDM.getUser(value.emailAddress);
      } catch (error) {
        // User not found
        if (error.statusCode === 404) {
          viewContext.error = error;
        } else {
          throw error;
        }
      }
    }

    // Lookup licences
    const { data, err, summary, pagination } = await CRM.documents.getLicences(filter, sort, {page, perPage: 50});
    if (err) {
      throw Boom.badImplementation('CRM error', err);
    }

    // Does user have no licences to view?
    if (data.length < 1 && !filter.string && !filter.email) {
      // Does user have outstanding verification codes?
      const { data: verifications, error } = await CRM.verification.findMany({entity_id: entityId, date_verified: null});
      if (error) {
        throw error;
      }
      if (verifications.length > 0) {
        return reply.redirect('/security-code');
      } else {
        return reply.redirect('/add-licences');
      }
    }

    // Does user have outstanding verification codes?
    const { data: verifications, error: err2 } = await CRM.verification.findMany({entity_id: entityId, date_verified: null});
    if (!err2 && verifications.length) {
      viewContext.showVerificationAlert = true;
    }

    // Render HTML page
    viewContext.licenceData = data;
    viewContext.debug.licenceData = data;
    viewContext.pageTitle = 'Your licences';
    viewContext.customTitle = 'Your water abstraction or impoundment licences';
    viewContext.pagination = pagination;
    viewContext.me = request.auth.credentials;

    // Calculate whether to display email filter / search form depending on summary
    const userRoles = licenceRoles(summary);

    viewContext.licenceCount = licenceCount(summary);
    viewContext.showManageFilter = userRoles.primary_user;
    if (userRoles.admin || userRoles.agent || userRoles.user) {
      viewContext.showManageFilter = false;
    }

    if (request.permissions && request.permissions.admin.defra) {
    // never restrict search box for admin users
    } else {
      viewContext.enableSearch = viewContext.licenceCount > 5; // @TODO confirm with design team
      viewContext.showEmailFilter = userRoles.admin || userRoles.agent;
    }

    if (request.permissions && request.permissions.admin.defra) {
      return reply.view('water/licences_admin', viewContext);
    } else {
      return reply.view('water/licences', viewContext);
    }
  } catch (error) {
    errorHandler(request, reply)(error);
  }
}

/**
 * Gets the licence page title based on the view, licence number and custom title
 * @param {String} view - the handlebars view
 * @param {String} licenceNumber - the licence number
 * @param {String} [customTitle] - if set, the custom name given by user to licence
 * @return {String} page title
 */
function _getLicencePageTitle (view, licenceNumber, customName) {
  if (view === 'water/licences_purposes') {
    return `Abstraction purposes for ${customName || licenceNumber}`;
  }
  if (view === 'water/licences_points') {
    return `Abstraction points for ${customName || licenceNumber}`;
  }
  if (view === 'water/licences_conditions') {
    return `Conditions held for ${customName || licenceNumber}`;
  }
  if (view === 'water/licences_contact') {
    return 'Your licence contact details';
  }
  // Default view/rename
  return customName ? `Licence name ${customName}` : `Licence number ${licenceNumber}`;
}

/**
 * HOF to create a HAPI route handler for a licence with the
 * specified view
 * @param {String} view - the template to load
 * @return {Function} HAPI route handler
 */
function createLicencePage (view) {
  return async function (request, reply, context = {}) {
    const { entity_id: entityId } = request.auth.credentials;

    const viewContext = Object.assign({}, View.contextDefaults(request), context);
    viewContext.activeNavLink = 'view';

    // Get filtered list of licences
    const filter = {
      entity_id: entityId,
      document_id: request.params.licence_id
    };

    try {
      // Get CRM data
      const response = await CRM.documents.getLicences(filter);
      if (response.error) {
        throw Boom.badImplementation(`CRM error`, response);
      }
      if (response.data.length !== 1) {
        throw new Boom.notFound('Document not found in CRM', response);
      }
      viewContext.crmData = response.data[0];

      // Get permit repo data
      const {error: permitError, data: permitData} = await Permit.licences.findOne(response.data[0].system_internal_id);

      if (permitError) {
        throw permitError;
      }

      // Handle object/JSON string
      const {licence_data_value: licenceData} = permitData;

      const data = typeof (licenceData) === 'string' ? JSON.parse(licenceData) : licenceData;

      require('fs').writeFileSync('../nald-licence.json', JSON.stringify(data, null, 2));

      const transformer = new LicenceTransformer();
      await transformer.load(data);

      viewContext.licence_id = request.params.licence_id;
      viewContext.licenceData = transformer.export();
      viewContext.debug.licenceData = data;

      // Page title
      const { document_custom_name: customName } = viewContext.crmData;
      const { licenceNumber } = viewContext.licenceData;
      viewContext.pageTitle = _getLicencePageTitle(view, licenceNumber, customName);
      viewContext.name = 'name' in viewContext ? viewContext.name : customName;

      return reply.view(view, viewContext);
    } catch (error) {
      errorHandler(request, reply)(error);
    }
  };
}

// Create specific view handlers
const getLicence = createLicencePage('water/licence');
const getLicenceContact = createLicencePage('water/licences_contact');
const getLicenceRename = createLicencePage('water/licences_rename');
const getLicenceConditions = createLicencePage('water/licences_conditions');
const getLicencePoints = createLicencePage('water/licences_points');
const getLicencePurposes = createLicencePage('water/licences_purposes');

/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
function postLicence (request, reply) {
  const { name } = request.payload;
  const { entity_id: entityId } = request.auth.credentials;

  // Prepare filter for filtering licence list from CRM
  const filter = {
    entity_id: entityId,
    document_id: request.params.licence_id
  };

  // Validate supplied licence name
  const schema = {
    name: Joi.string().trim().required().min(2).max(32).regex(/^[a-z0-9 ']+$/i)
  };
  const {error, value} = Joi.validate({name}, schema, {abortEarly: false});
  if (error) {
    return getLicenceRename(request, reply, { error, name: request.payload.name });
  }

  CRM.documents.getLicences(filter)
    .then((response) => {
      if (!response || response.err) {
        throw new Boom.badImplementation('CRM error', response);
      }

      if (response.data.length !== 1) {
        throw new Boom.notFound('Document not found in CRM');
      }

      // Get the document ID from the returned CRM data
      const { document_id: documentId } = response.data[0];

      // Udpate licence name in CRM
      return CRM.documents.setLicenceName(documentId, value.name);
    })
    .then((response) => {
      // Licence updated - redirect to licence view
      reply.redirect(`/licences/${request.params.licence_id}`);
    })
    .catch(errorHandler(request, reply));
}

module.exports = {
  getLicences,
  getLicence,
  postLicence,
  getLicenceContact,
  getLicenceRename,
  getLicenceConditions,
  getLicencePoints,
  getLicencePurposes
};
