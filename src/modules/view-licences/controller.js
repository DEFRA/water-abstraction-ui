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
const { countRoles, getLicencePageTitle } = require('./helpers');

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
  const { entity_id: entityId, roles } = request.auth.credentials;

  // Check if user has any licences
  const licenceCount = await getLicenceCount(entityId);
  if (licenceCount === 0) {
    return reply.redirect('/add-licences');
  }
  view.enableSearch = licenceCount > 5;

  // Check for verifications
  const { data: verifications } = await getOutstandingVerifications(entityId);
  if (verifications.length) {
    if (licenceCount === 0) {
      return reply.redirect('/security-code');
    }
    view.showVerificationAlert = true;
  }

  // Count primary_user/user roles to determine if agent
  // Agents have the ability to search by user email address
  const roleCount = countRoles(roles, ['user', 'primary_user']);
  view.showEmailFilter = roleCount > 1;

  return baseGetLicences(request, reply);
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
    request.view.pageTitle = getLicencePageTitle(request.config.view, licenceNumber, customName);
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
};
