'use strict';

const Boom = require('@hapi/boom');
const { get, partialRight } = require('lodash');

const sessionForms = require('shared/lib/session-forms');
const { handleRequest, getValues, applyErrors } = require('shared/lib/forms');
const { crmRoles } = require('shared/lib/constants');
const routing = require('../lib/routing');

const { getReturnStatusString } = require('../lib/return-mapper');
const { SESSION_KEYS } = require('../lib/constants');

// Services
const services = require('../../../lib/connectors/services');

// Controller helpers
const controller = require('../lib/controller');

// Forms
const licenceNumbersForm = require('../forms/licence-numbers');
const confirmForm = require('shared/lib/forms/confirm-form');
const selectReturnsForm = require('../forms/select-returns');
const selectAddressForm = require('../forms/select-address');
const recipientForm = require('../forms/recipient');
const licenceHoldersForm = require('../forms/select-licence-holders');

// State
const actions = require('../lib/actions');
const { reducer } = require('../lib/reducer');

// Mappers
const roleMapper = require('shared/lib/mappers/role');

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

const mapStateToView = state => Object.values(state)
  .filter(row => row.isSelected)
  .map(({ document, returns, licence, selectedRole }) => ({
    id: document.id,
    licenceNumber: licence.licenceNumber,
    returns: returns.filter(ret => ret.isSelected).map(mapReturnToView),
    licenceHolderRole: document.roles.find(isLicenceHolderRole),
    address: roleMapper.mapRoleToAddressArray(document.roles.find(role => role.roleName === selectedRole)),
    selectReturnsLink: routing.getSelectReturns(document.id),
    selectAddressLink: routing.getSelectAddress(document.id)
  }));

/**
 * Check answers page for forms to send
 */
const getCheckAnswers = async (request, h) => {
  const view = {
    ...request.view,
    documents: mapStateToView(request.pre.state),
    back: routing.getEnterLicenceNumber(),
    form: confirmForm.form(request, 'Send paper forms')
  };
  return h.view('nunjucks/returns-notifications/check-answers', view);
};

const mapStateToWaterApi = state => ({
  forms: Object.values(state)
    .filter(doc => doc.isSelected)
    .map(({ document, returns, selectedRole }) => {
      const { company, contact, address } = document.roles.find(role => role.roleName === selectedRole);

      return {
        company,
        contact: contact || null,
        address,
        returns: returns.filter(ret => ret.isSelected).map(ret => ({
          returnId: ret.id
        }))
      };
    })
});

/**
 * Post handler to send forms
 */
const postCheckAnswers = async (request, h) => {
  // Prepare data for API call
  const { userName: issuer } = request.defra;
  const data = mapStateToWaterApi(request.pre.state);

  // Prepare batch notification
  const { data: { id: eventId } } = await services.water.batchNotifications.preparePaperReturnForms(issuer, data);

  // Redirect to waiting page while messages are sent
  return h.redirect(`/returns-notifications/${eventId}/send`);
};

/**
 * Select which licence holders to include
 */
const getSelectLicenceHolders = partialRight(controller.createGetHandler, licenceHoldersForm);
const postSelectLicenceHolders = partialRight(controller.createPostHandler, licenceHoldersForm, actions.setLicenceHolders, routing.getCheckAnswers);

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

/**
 * Select one-time address full name
 */
const getRecipient = partialRight(controller.createGetHandler, recipientForm);
const postRecipient = partialRight(controller.createPostHandler, recipientForm, actions.setOneTimeAddressName, routing.getAddressFlowRedirect);

/**
 * Handle return from address flow plugin
 */
const getAcceptOneTimeAddress = (request, h) => {
  // Get address from address plugin and process action
  const { documentId } = request.params;
  const action = actions.setOneTimeAddress(documentId, request.getNewAddress());
  controller.processAction(request, action);

  // Redirect to check answers page
  return h.redirect(routing.getCheckAnswers());
};

const isValidEvent = event => event.type === 'notification' && event.subtype === 'paperReturnForms';

/**
 * Waits while the water service event is processed, then sends the notification
 * @param {*} request
 * @param {*} h
 */
const getSend = async (request, h) => {
  const { event } = request.pre;

  if (!isValidEvent(event)) {
    return Boom.notFound(`Event ${event.event_id} is not a paper forms notification`);
  }

  // Water service processing in progress - show waiting page
  if (event.status === 'processing') {
    return h.view('nunjucks/returns-notifications/waiting', {
      ...request.view,
      pageTitle: 'Sending paper return forms'
    });
  }
  // Error
  if (event.status === 'error') {
    return Boom.badImplementation(`Event ${event.event_id} error`);
  }

  // Show the confirmation page
  return h.view('nunjucks/returns-notifications/confirmation', request.view);
};

exports.getEnterLicenceNumber = getEnterLicenceNumber;
exports.postEnterLicenceNumber = postEnterLicenceNumber;

exports.getCheckAnswers = getCheckAnswers;
exports.postCheckAnswers = postCheckAnswers;

exports.getSelectLicenceHolders = getSelectLicenceHolders;
exports.postSelectLicenceHolders = postSelectLicenceHolders;

exports.getSelectReturns = getSelectReturns;
exports.postSelectReturns = postSelectReturns;

exports.getSelectAddress = getSelectAddress;
exports.postSelectAddress = postSelectAddress;

exports.getRecipient = getRecipient;
exports.postRecipient = postRecipient;

exports.getAcceptOneTimeAddress = getAcceptOneTimeAddress;

exports.getSend = getSend;
