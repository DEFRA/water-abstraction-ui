/**
 * HAPI Route handlers for viewing and managing licences
 * @module controllers/licences
 */

/* eslint "new-cap" : ["warn", { "newIsCap": true }] */
const Boom = require('boom');
const CRM = require('../../lib/connectors/crm');
const { getLicenceCount } = require('../../lib/connectors/crm/documents');
const { getOutstandingVerifications } = require('../../lib/connectors/crm/verification');

const { getLicences: baseGetLicences } = require('./base');

// const IDM = require('../../lib/connectors/idm');
// const View = require('../../lib/view');
const Permit = require('../../lib/connectors/permit');
const errorHandler = require('../../lib/error-handler');
const LicenceTransformer = require('../../lib/licence-transformer/');

// const {licenceRoles, licenceCount} = require('../lib/licence-helpers');
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
  const { view } = request;
  // const { page } = request.query;
  const { entity_id: entityId } = request.auth.credentials;

  // Check if user has any licences
  const licenceCount = await getLicenceCount(entityId);
  if (licenceCount === 0) {
    return reply.redirect('/add-licences');
  }
  view.enableSearch = licenceCount > 5;

  // Check for verifications
  const { data: verifications } = await getOutstandingVerifications(entityId);
  view.showVerificationAlert = verifications.length > 0;

  return baseGetLicences(request, reply);

  // return _getLicences(request, reply);

  // const sort = mapSort(request.query);
  // const filter = mapFilter(entityId, request.query);
  //
  // // Get licences from CRM
  // const { data, error, pagination } = await CRM.documents.getLicences(filter, sort, {
  //   page,
  //   perPage: 50
  // });
  // if (error) {
  //   reply(Boom.badImplementation('CRM error', error));
  // }
  //
  // return reply.view('water/view-licences/licences', {
  //   ...view,
  //   licenceData: data,
  //   pagination
  // });

  // const viewContext = View.contextDefaults(request);
  // request.view.activeNavLink = 'view';
  //
  // const {
  //   entity_id: entityId
  // } = request.auth.credentials;
  // let filter = {};
  //
  // if (request.permissions && request.permissions.admin.defra) {
  //   filter = {
  //     entity_id: entityId,
  //     string: request.query.licenceNumber,
  //     email: request.query.emailAddress
  //   };
  //
  //   if (filter.email) {
  //     delete filter.entity_id;
  //   }
  //
  //   if (!filter.string && !filter.email) {
  //     // if admin user and no search params entered, don't show search results
  //     request.view.showAdminIntro = true;
  //     request.view.showResults = false;
  //     request.view.licenceData = null;
  //     request.view.enableSearch = true;
  //     request.view.showEmailFilter = true;
  //     return reply.view('water/view-licences/licences_admin', viewContext);
  //   } else {
  //     request.view.enableSearch = true;
  //     request.view.showEmailFilter = true;
  //     request.view.showAdminIntro = true;
  //     request.view.showResults = true;
  //   }
  // } else {
  //   request.view.showResults = true;
  //   // Get filtered list of licences
  //   filter = {
  //     entity_id: entityId,
  //     string: request.query.licenceNumber,
  //     email: request.query.emailAddress
  //   };
  // }
  //
  // // Current page of results - for paginated result set
  // const page = request.query.page || 1;
  //
  // // Sorting
  // const sortFields = {
  //   licenceNumber: 'system_external_id',
  //   name: 'document_name',
  //   expiryDate: 'document_expires'
  // };
  // const sortField = request.query.sort || 'licenceNumber';
  // const direction = request.query.direction === -1 ? -1 : 1;
  // const sort = {};
  // sort[sortFields[sortField]] = direction;
  //
  // // Set sort info on viewContext
  // request.view.direction = direction;
  // request.view.sort = sortField;
  //
  // // Validate email address
  // const schema = {
  //   emailAddress: Joi.string().allow('').email(),
  //   licenceNumber: Joi.string().allow(''),
  //   sort: Joi.string().allow(''),
  //   direction: Joi.number(),
  //   page: Joi.number()
  // };
  // const {
  //   error,
  //   value
  // } = Joi.validate(request.query, schema);
  // if (error) {
  //   request.view.error = error;
  // }
  // try {
  //   // Look up user for email filter
  //   if (value.emailAddress && !error) {
  //     try {
  //       await IDM.getUser(value.emailAddress);
  //     } catch (error) {
  //       // User not found
  //       if (error.statusCode === 404) {
  //         request.view.error = error;
  //       } else {
  //         throw error;
  //       }
  //     }
  //   }
  //
  //   // Get total licence count for this user - this determines whether to show search box
  //   const {
  //     pagination: {
  //       totalRows: licenceCount
  //     }
  //   } = await CRM.documents.getLicences({
  //     entity_id: entityId
  //   }, null, {
  //     page: 1,
  //     perPage: 1
  //   });
  //
  //   console.log('licenceCount', {
  //     entity_id: entityId
  //   });
  //
  //   // Lookup licences
  //   const {
  //     data,
  //     err,
  //     pagination
  //   } = await CRM.documents.getLicences(filter, sort, {
  //     page,
  //     perPage: 50
  //   });
  //   if (err) {
  //     throw Boom.badImplementation('CRM error', err);
  //   }
  //
  //   // Does user have no licences to view?
  //   if (data.length < 1 && !filter.string && !filter.email) {
  //     // Does user have outstanding verification codes?
  //     const {
  //       data: verifications,
  //       error
  //     } = await CRM.verification.findMany({
  //       entity_id: entityId,
  //       date_verified: null
  //     });
  //     if (error) {
  //       throw error;
  //     }
  //     if (verifications.length > 0) {
  //       return reply.redirect('/security-code');
  //     } else {
  //       return reply.redirect('/add-licences');
  //     }
  //   }
  //
  //   // Does user have outstanding verification codes?
  //   const {
  //     data: verifications,
  //     error: err2
  //   } = await CRM.verification.findMany({
  //     entity_id: entityId,
  //     date_verified: null
  //   });
  //   if (!err2 && verifications.length) {
  //     request.view.showVerificationAlert = true;
  //   }
  //
  //   // Render HTML page
  //   request.view.licenceData = data;
  //   request.view.debug.licenceData = data;
  //   // request.view.pageTitle = 'Your licences';
  //   // request.view.customTitle = 'Your water abstraction or impoundment licences';
  //   request.view.pagination = pagination;
  //   // request.view.me = request.auth.credentials;
  //
  //   request.view.licenceCount = licenceCount;
  //
  //   const {
  //     roles
  //   } = request.auth.credentials;
  //
  //   // Count primary_user/user roles to determine if agent
  //   const userRoleCount = roles.reduce((memo, role) => {
  //     if (role.role === 'user' || role.role === 'primary_user') {
  //       return memo + 1;
  //     }
  //     return memo;
  //   }, 0);
  //
  //   if (request.permissions && request.permissions.admin.defra) {
  //     // never restrict search box for admin users
  //   } else {
  //     request.view.enableSearch = licenceCount > 5;
  //     request.view.showEmailFilter = request.permissions.admin.defra || userRoleCount > 1;
  //   }
  //
  //   if (request.permissions && request.permissions.admin.defra) {
  //     return reply.view('water/view-licences/licences_admin', viewContext);
  //   } else {
  //     return reply.view('water/view-licences/licences', viewContext);
  //   }
  // } catch (error) {
  //   errorHandler(request, reply)(error);
  // }
}

/**
 * Gets the licence page title based on the view, licence number and custom title
 * @param {String} view - the handlebars view
 * @param {String} licenceNumber - the licence number
 * @param {String} [customTitle] - if set, the custom name given by user to licence
 * @return {String} page title
 */
function _getLicencePageTitle (view, licenceNumber, customName) {
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

/**
 * View details for a single licence
 */
async function getLicenceDetail (request, reply) {
  const {
    entity_id: entityId
  } = request.auth.credentials;

  request.view.activeNavLink = 'view';

  // const viewContext = Object.assign({}, View.contextDefaults(request), context);
  // request.view.activeNavLink = 'view';

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
    request.view.crmData = response.data[0];

    // Get permit repo data
    const {
      error: permitError,
      data: permitData
    } = await Permit.licences.findOne(response.data[0].system_internal_id);

    if (permitError) {
      throw permitError;
    }

    // Handle object/JSON string
    const {
      licence_data_value: licenceData
    } = permitData;

    const data = typeof (licenceData) === 'string' ? JSON.parse(licenceData) : licenceData;

    // require('fs').writeFileSync('../nald-licence.json', JSON.stringify(data, null, 2));

    const transformer = new LicenceTransformer();
    await transformer.load(data);

    request.view.licence_id = request.params.licence_id;
    request.view.licenceData = transformer.export();
    request.view.debug.licenceData = data;

    // console.log(JSON.stringify(request.view.licenceData, null, 2));

    // Page title
    const {
      document_name: customName
    } = request.view.crmData;
    const {
      licenceNumber
    } = request.view.licenceData;
    request.view.pageTitle = _getLicencePageTitle(request.config.view, licenceNumber, customName);
    request.view.name = 'name' in request.view ? request.view.name : customName;

    return reply.view(request.config.view, request.view);
  } catch (error) {
    errorHandler(request, reply)(error);
  }
};

/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
function postLicenceRename (request, reply) {
  const {
    name
  } = request.payload;
  const {
    entity_id: entityId
  } = request.auth.credentials;

  // Prepare filter for filtering licence list from CRM
  const filter = {
    entity_id: entityId,
    document_id: request.params.licence_id
  };

  // Validate supplied licence name
  const schema = {
    name: Joi.string().trim().required().min(2).max(32).regex(/^[a-z0-9 ']+$/i)
  };
  const {
    error,
    value
  } = Joi.validate({
    name
  }, schema, {
    abortEarly: false
  });
  if (error) {
    return getLicenceDetail(request, reply, {
      error,
      name: request.payload.name
    });
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
      const {
        document_id: documentId
      } = response.data[0];

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
  getLicenceDetail,
  postLicenceRename
  // getLicences,
  // getLicence,
  // postLicence,
  // getLicenceContact,
  // getLicenceRename,
  // getLicenceConditions,
  // getLicencePoints,
  // getLicencePurposes
};
