'use strict';

const { get, partialRight } = require('lodash');

const sessionForms = require('shared/lib/session-forms');
const { handleRequest, getValues, applyErrors } = require('shared/lib/forms');
const { crmRoles } = require('shared/lib/constants');
const services = require('../../../lib/connectors/services');
const routing = require('../lib/routing');

const { getReturnStatusString } = require('../lib/return-mapper');
const { SESSION_KEYS } = require('../lib/constants');

// Controller helpers
const controller = require('../lib/controller');

// Forms
const licenceNumbersForm = require('../forms/licence-numbers');
const confirmForm = require('shared/lib/forms/confirm-form');
const selectReturnsForm = require('../forms/select-returns');
const selectAddressForm = require('../forms/select-address');

// State
const actions = require('../lib/actions');
const { reducer } = require('../lib/reducer');

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

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  try {
    const { licenceNumbers } = getValues(form);

    // Get water service data on incomplete returns
    const data = await services.water.returns.getIncompleteReturns(licenceNumbers);

    // Set session state and redirect
    const nextState = reducer({}, actions.setInitialState(request, data));
    request.yar.set(SESSION_KEYS.paperFormsFlow, nextState);

    const path = isMultipleLicenceHoldersForLicence(data) ? routing.getSelectLicenceHolders() : routing.getCheckAnswers();
    return h.redirect(path);
  } catch (err) {
    // Unexpected error
    if (err.statusCode !== 404) {
      throw err;
    }

    // Some/all licence numbers were not found
    const licenceNumbers = get(err, 'error.validationDetails.licenceNumbers', []);
    form = applyErrors(form, licenceNumbersForm.createNotFoundError(licenceNumbers));
    return h.postRedirectGet(form);
  }
};

const isLicenceHolderRole = role => role.roleName === crmRoles.licenceHolder;

const mapReturnToView = ret => ({
  legacyId: ret.returnRequirement.legacyId,
  details: getReturnStatusString(ret)
});

const mapStateToView = state => Object.values(state).map(({ document, returns, licence, selectedRole }) => ({
  id: document.id,
  licenceNumber: licence.licenceNumber,
  returns: returns.filter(ret => ret.isSelected).map(mapReturnToView),
  licenceHolderRole: document.roles.find(isLicenceHolderRole),
  selectedRole: document.roles.find(role => role.roleName === selectedRole),
  selectReturnsLink: routing.getSelectReturns(document.id),
  selectAddressLink: routing.getSelectAddress(document.id)
}));

/**
 * Check answers page for forms to send
 */
const getCheckAnswers = async (request, h) => {
  const state = request.yar.get(SESSION_KEYS.paperFormsFlow);
  const view = {
    ...request.view,
    documents: mapStateToView(state),
    back: routing.getEnterLicenceNumber(),
    form: confirmForm.form(request, 'Send paper forms')
  };
  return h.view('nunjucks/returns-notifications/check-answers', view);
};

/**
 * Select which returns paper forms to send
 */
const getSelectReturns = partialRight(controller.createGetHandler, selectReturnsForm);
const postSelectReturns = partialRight(controller.createPostHandler, selectReturnsForm, actions.setReturnIds, routing.getCheckAnswers);

/**
 * Select which address to send the paper form to
 */
const getSelectAddress = partialRight(controller.createGetHandler, selectAddressForm);
const postSelectAddress = partialRight(controller.createPostHandler, selectAddressForm, actions.setSelectedRole, routing.getSelectAddressRedirect);

exports.getEnterLicenceNumber = getEnterLicenceNumber;
exports.postEnterLicenceNumber = postEnterLicenceNumber;
exports.getCheckAnswers = getCheckAnswers;

exports.getSelectReturns = getSelectReturns;
exports.postSelectReturns = postSelectReturns;

exports.getSelectAddress = getSelectAddress;
exports.postSelectAddress = postSelectAddress;
