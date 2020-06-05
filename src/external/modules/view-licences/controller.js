const { throwIfError } = require('@envage/hapi-pg-rest-api');

const services = require('../../lib/connectors/services');

const config = require('external/config');
const { handleRequest, getValues } = require('shared/lib/forms');
const { renameLicenceForm, renameLicenceSchema } = require('./forms/rename');

const { getCommonViewContext, getCommonBackLink } = require('shared/lib/view-licence-helpers');
const { mapSort, mapFilter } = require('./helpers');

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
async function getLicences (request, h) {
  const { view } = request;

  const verifications = request.licence.outstandingVerifications;
  const licenceCount = request.licence.userLicenceCount;

  if (licenceCount === 0) {
    return verifications.length === 0
      ? h.redirect('/add-licences')
      : h.redirect('/security-code');
  }

  // Set view flags
  view.showVerificationAlert = verifications.length > 0;
  view.enableSearch = licenceCount > 5;

  if (request.formError) {
    return h.view('nunjucks/view-licences/licences', request.view);
  }

  const companyId = request.yar.get('companyId');
  const { page, emailAddress } = request.query;
  const sort = mapSort(request.query);
  const filter = mapFilter(companyId, request.query);

  // Check if user exists
  if (emailAddress) {
    const user = await services.idm.users.findOneByEmail(emailAddress, config.idm.application);
    request.view.error = !user;
  }

  // Get licences from CRM
  const { data, error, pagination } = await services.crm.documents.findMany(filter, sort, {
    page,
    perPage: 50
  });

  if (error) {
    throw error;
  }

  return h.view('nunjucks/view-licences/licences', {
    ...request.view,
    licenceData: data,
    pagination
  });
}

/**
 * Renders a page for the user to set/update licence name
 */
const getLicenceRename = (request, h, form) => {
  const { documentName } = request.licence.summary;
  const view = {
    ...getCommonViewContext(request),
    ...getCommonBackLink(request),
    form: form || renameLicenceForm(request, documentName),
    pageTitle: `Name licence ${request.licence.summary.licenceNumber}`
  };
  return h.view('nunjucks/view-licences/rename', view);
};

/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
const postLicenceRename = async (request, h) => {
  const { documentId } = request.params;
  const { documentName } = request.licence.summary;
  const { userName } = request.defra;
  const form = handleRequest(renameLicenceForm(request, documentName), request, renameLicenceSchema, { abortEarly: true });

  // Validation error - redisplay form
  if (!form.isValid) {
    return getLicenceRename(request, h, form);
  }

  // Rename licence
  const { name } = getValues(form);
  const rename = !!documentName;
  const { error } = await services.water.documents.postLicenceRename(documentId, { documentName: name, rename, userName });
  throwIfError(error);

  return h.redirect(`/licences/${documentId}`);
};

exports.getLicences = getLicences;
exports.postLicenceRename = postLicenceRename;
exports.getLicenceRename = getLicenceRename;
