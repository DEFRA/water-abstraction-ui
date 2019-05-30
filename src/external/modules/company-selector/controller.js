/**
 * Company switcher
 * For external users with > 1 role, allows the user to select the company
 * they wish to view/manage
 */

const Boom = require('boom');
const { get } = require('lodash');

const loginHelpers = require('../../lib/login-helpers');
const { selectCompanyForm } = require('./forms/select-company');
const { handleRequest, getValues } = require('../../../shared/lib/forms');

/**
 * Renders select company form for current user
 * @param  {Object} request - HAPI request
 * @param  {Object} h       - HAPI reply interface
 * @param  {Object} form    - select company form object
 * @return {String}         rendered page
 */
const renderForm = (request, h, form) => {
  const view = {
    ...request.view,
    form,
    back: '/licences',
    pageTitle: 'Choose a licence holder'
  };
  return h.view('nunjucks/auth/select-company.njk', view, { layout: false });
};

/**
 * Displays a page where the user can select the company they wish to manage
 */
const getSelectCompany = async (request, h) => {
  const { userId } = request.defra;
  const data = await loginHelpers.loadUserData(userId);
  const form = selectCompanyForm(request, data);
  return renderForm(request, h, form);
};

/**
 * POST handler for when user has selected the company they wish to manage
 * @param {String} request.payload.company - the index of the company to select
 */
const postSelectCompany = async (request, h) => {
  const { userId } = request.defra;
  const data = await loginHelpers.loadUserData(userId);
  const form = handleRequest(selectCompanyForm(request, data), request);

  // Set company entity and redirect if valid
  if (form.isValid) {
    const { company: index } = getValues(form);

    const company = get(data, `companies.${index}`);

    if (!company) {
      throw Boom.badRequest(`Company not found`, { index });
    }

    // Set company ID in session cookie
    loginHelpers.selectCompany(request, company);

    // Redirect
    return h.redirect('/licences');
  }
  return renderForm(request, h, form);
};

exports.getSelectCompany = getSelectCompany;
exports.postSelectCompany = postSelectCompany;
