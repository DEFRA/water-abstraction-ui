'use strict';

const { get, partialRight, isFunction } = require('lodash');

const sessionForms = require('shared/lib/session-forms');
const { handleRequest, getValues, applyErrors } = require('shared/lib/forms');
const { crmRoles } = require('shared/lib/constants');
const services = require('../../../lib/connectors/services');

const { getReturnStatusString } = require('../lib/return-mapper');
const { SESSION_KEYS } = require('../lib/constants');

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
  selectReturnsLink: `/returns-notifications/${document.id}/select-returns`,
  selectAddressLink: `/returns-notifications/${document.id}/select-address`
}));

/**
 * Check answers page for forms to send
 */
const getCheckAnswers = async (request, h) => {
  const state = request.yar.get(SESSION_KEYS.paperFormsFlow);
  const view = {
    ...request.view,
    documents: mapStateToView(state),
    back: '/returns-notifications/paper-forms',
    form: confirmForm.form(request, 'Send paper forms')
  };
  return h.view('nunjucks/returns-notifications/check-answers', view);
};

/**
 * Generic get handler
 */
const createGetHandler = async (request, h, formContainer) => {
  const { document } = request.pre;
  const view = {
    ...request.view,
    caption: `Licence ${document.document.licenceNumber}`,
    back: '/returns-notifications/check-answers',
    form: formContainer.form(request, document)
  };
  return h.view('nunjucks/form', view);
};

const createPostHandler = async (request, h, formContainer, actionCreator, redirectPath) => {
  const { document } = request.pre;

  const schema = formContainer.schema(request, document);
  const form = handleRequest(formContainer.form(request, document), request, schema);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const currentState = request.yar.get(SESSION_KEYS.paperFormsFlow);
  const nextState = reducer(currentState, actionCreator(request, getValues(form)));
  request.yar.set(SESSION_KEYS.paperFormsFlow, nextState);

  const path = isFunction(redirectPath) ? redirectPath(request, { form, document, nextState }) : redirectPath;
  return h.redirect(path);
};

/**
 * Select which returns paper forms to send
 */
const getSelectReturns = partialRight(createGetHandler, selectReturnsForm);
const postSelectReturns = partialRight(createPostHandler, selectReturnsForm, actions.setReturnIds, '/returns-notifications/check-answers');

/**
 * Select which address to send the paper form to
 */
const getSelectAddressRedirectPath = (request, { form, document }) => {
  const { selectedRole } = getValues(form);
  if (selectedRole === 'createOneTimeAddress') {
    return `/returns-notifications/${document.document.id}/one-time-address`;
  }
  return '/returns-notifications/check-answers';
};
const getSelectAddress = partialRight(createGetHandler, selectAddressForm);
const postSelectAddress = partialRight(createPostHandler, selectAddressForm, actions.setSelectedRole, getSelectAddressRedirectPath);

exports.getEnterLicenceNumber = getEnterLicenceNumber;
exports.postEnterLicenceNumber = postEnterLicenceNumber;
exports.getCheckAnswers = getCheckAnswers;

exports.getSelectReturns = getSelectReturns;
exports.postSelectReturns = postSelectReturns;

exports.getSelectAddress = getSelectAddress;
exports.postSelectAddress = postSelectAddress;
