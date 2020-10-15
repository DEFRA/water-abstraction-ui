'use strict';

const { get } = require('lodash');

const sessionForms = require('shared/lib/session-forms');
const { handleRequest, getValues, applyErrors } = require('shared/lib/forms');
const { crmRoles } = require('shared/lib/constants');
const services = require('../../../lib/connectors/services');

// Forms
const licenceNumbersForm = require('../forms/licence-numbers');
const confirmForm = require('shared/lib/forms/confirm-form');

// State
const actions = require('../lib/actions');
const { reducer } = require('../lib/reducer');

const sessionKey = 'returns.paper-forms';

/**
 * Renders a page for the user to input a list of licences to whom
 * they wish to send paper return forms
 */
const getEnterLicenceNumber = async (request, h) => {
  return h.view('nunjucks/form', {
    ...request.view,
    back: '/manage',
    form: sessionForms.get(request, licenceNumbersForm.form(request))
  });
};

const isMultipleLicenceHoldersForLicence = data => data.some(row => row.documents.length > 1);

/**
 * Post handler for licence numbers entry
 */
const postEnterLicenceNumber = async (request, h) => {
  let form = handleRequest(licenceNumbersForm.form(request), request, licenceNumbersForm.schema);

  if (form.isValid) {
    const { licenceNumbers } = getValues(form);

    try {
      // Get water service data on incomplete returns
      const data = await services.water.returns.getIncompleteReturns(licenceNumbers);

      // Set session state and redirect
      const nextState = reducer({}, actions.setInitialState(request, data));
      request.yar.set(sessionKey, nextState);

      const path = isMultipleLicenceHoldersForLicence(data) ? '/returns-notifications/select-licence-holders' : '/returns-notifications/check-answers';
      return h.redirect(path);
    } catch (err) {
      // Unexpected error
      if (err.statusCode !== 404) {
        throw err;
      }

      // Some/all licence numbers were not found
      const licenceNumbers = get(err, 'error.validationDetails.licenceNumbers', []);
      form = applyErrors(form, licenceNumbersForm.createNotFoundError(licenceNumbers));
    }
  }

  return h.postRedirectGet(form);
};

const isLicenceHolderRole = role => role.roleName === crmRoles.licenceHolder;

const mapStateToView = data => {
  return data.map(row => ({
    licenceNumber: row.licence.licenceNumber,
    documents: row.documents.map(({ document, returns }) => ({
      returns: returns.filter(ret => ret.isSelected),
      licenceHolderRole: document.roles.find(isLicenceHolderRole),
      selectedRole: document.roles.find(doc => doc.roleName === document.selectedRole)
    }))
  }));
};

/**
 * Check answers page for forms to send
 */
const getCheckAnswers = async (request, h) => {
  const state = request.yar.get(sessionKey);
  const view = {
    ...request.view,
    licences: mapStateToView(state),
    back: '/returns-notifications/paper-forms',
    form: confirmForm.form(request, 'Send paper forms')
  };
  return h.view('nunjucks/returns-notifications/check-answers', view);
};

exports.getEnterLicenceNumber = getEnterLicenceNumber;
exports.postEnterLicenceNumber = postEnterLicenceNumber;
exports.getCheckAnswers = getCheckAnswers;
