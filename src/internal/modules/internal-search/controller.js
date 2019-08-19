'use strict';

const { get, flatMap } = require('lodash');
const { searchForm, searchFormSchema } = require('./forms/search-form');
const forms = require('shared/lib/forms');
const services = require('../../lib/connectors/services');
const { mapResponseToView } = require('./lib/api-response-mapper');
const { isReturnId } = require('../returns/lib/helpers');
const { redirectToReturn } = require('./lib/redirect-to-return');
const { isManageAccounts } = require('../../lib/permissions');
const { setPermissionsForm, setPermissionsSchema, permissionsChoices } = require('../account/forms/set-permissions');

/**
 * Renders a search form and results pages for internal users to search
 * for licences, licence holders, users, and returns
 * @param  {Object} request - HAPI request
 * @param {String} request.query.query - the search term
 * @param  {Object} h       - HAPI response toolkit
 * @return {Promise}        - resolves with response
 */
const getSearchForm = async (request, h) => {
  let form = searchForm();

  const { view } = request;

  if ('query' in request.query) {
    form = forms.handleRequest(form, request, searchFormSchema);
    const { query } = forms.getValues(form);

    if (form.isValid) {
      const { page } = request.query;

      const response = await services.water.internalSearch.getInternalSearchResults(query, page);

      Object.assign(view, mapResponseToView(response, request), { query });

      if (isReturnId(query)) {
        return redirectToReturn(query, view, h);
      }
    }
  }

  view.form = form;

  return h.view('nunjucks/internal-search/index.njk', view, { layout: false });
};

const getRegisteredLicenceCount = companies => {
  return companies.reduce((acc, company) => {
    const licences = get(company, 'registeredLicences', []);
    return acc + licences.length;
  }, 0);
};

const getOutstandingVerificationLicenceCount = companies => {
  return companies.reduce((acc, company) => {
    const verifications = get(company, 'outstandingVerifications', []);
    const licences = flatMap(verifications, v => v.licences);
    return acc + licences.length;
  }, 0);
};

const getPermissionsFormData = async (request) => {
  if (isManageAccounts(request)) {
    const user = await services.idm.users.findOneById(request.params.userId);
    const permission = get(user, 'groups[0]');
    return setPermissionsForm(request, permission);
  }
};

const getPermissionsLabelText = user => {
  const updated = user;
  if (updated.groups[0] === 'nps') {
    const [subtype] = user.roles.filter(role => role.substring(0, 2) === 'ar');
    if (subtype) updated.groups[0] = `nps_${subtype}`;
  }

  if (updated.groups.length === 0 && updated.roles.length === 0) updated.groups[0] = 'basic';
  const [updatedPermission] = permissionsChoices.filter(choice => choice.value === updated.groups[0]);
  return updatedPermission;
};

const getUserStatus = async (request, h, formFromPost) => {
  const response = await services.water.users.getUserStatus(request.params.userId);

  const userStatus = response.data;
  userStatus.unverifiedLicenceCount = getOutstandingVerificationLicenceCount(userStatus.companies);
  userStatus.verifiedLicenceCount = getRegisteredLicenceCount(userStatus.companies);
  userStatus.licenceCount = userStatus.unverifiedLicenceCount + userStatus.verifiedLicenceCount;

  const view = {
    ...request.view,
    userStatus,
    form: formFromPost || await getPermissionsFormData(request)
  };

  return h.view('nunjucks/internal-search/user-status.njk', view, { layout: false });
};

const postUpdatePermissions = async (request, h) => {
  const { permission } = request.payload;
  const { userId } = request.params;
  const { userId: callingUserId } = request.defra;
  const form = forms.handleRequest(
    setPermissionsForm(request, permission),
    request,
    setPermissionsSchema
  );

  if (form.isValid) {
    await services.water.users.updateInternalUserPermissions(callingUserId, userId, permission);
    return h.redirect(`/user/${userId}/update-permissions/success`);
  }

  return getUserStatus(request, h, form);
};

const getUpdateSuccessful = async (request, h) => {
  const { userId } = request.params;
  const user = await services.idm.users.findOneById(userId);
  const updatedPermissions = getPermissionsLabelText(user);
  return h.view('nunjucks/internal-search/update-permissions-success.njk', {
    ...request.view,
    updatedUser: user.user_name,
    updatedPermissions,
    back: `/user/${userId}/status`
  }, { layout: false });
};

exports.getSearchForm = getSearchForm;
exports.getUserStatus = getUserStatus;
exports.postUpdatePermissions = postUpdatePermissions;
exports.getUpdateSuccessful = getUpdateSuccessful;
