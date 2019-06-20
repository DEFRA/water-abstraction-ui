'use strict';

const { get, flatMap } = require('lodash');
const { searchForm, searchFormSchema } = require('./forms/search-form');
const { handleRequest, getValues } = require('shared/lib/forms');
const services = require('../../lib/connectors/services');
const { mapResponseToView } = require('./lib/api-response-mapper');
const { isReturnId } = require('../returns/lib/helpers');
const { redirectToReturn } = require('./lib/redirect-to-return');

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
    form = handleRequest(form, request, searchFormSchema);
    const { query } = getValues(form);

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

const getUserStatus = async (request, h) => {
  const { view } = request;
  const response = await services.water.users.getUserStatus(request.params.userId);

  const userStatus = response.data;
  userStatus.unverifiedLicenceCount = getOutstandingVerificationLicenceCount(userStatus.companies);
  userStatus.verifiedLicenceCount = getRegisteredLicenceCount(userStatus.companies);
  userStatus.licenceCount = userStatus.unverifiedLicenceCount + userStatus.verifiedLicenceCount;

  const viewContext = Object.assign(view, { userStatus });

  return h.view('nunjucks/internal-search/user-status.njk', viewContext, { layout: false });
};

exports.getSearchForm = getSearchForm;
exports.getUserStatus = getUserStatus;
