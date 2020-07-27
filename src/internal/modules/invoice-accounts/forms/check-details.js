'use strict';

const urlJoin = require('url-join');
const { formFactory, fields } = require('shared/lib/forms/');

/**
 * Returns the selected address id for the invoice account
 * along with the predtermined company id and region id
 * @param {Object} request The Hapi request object
 * @param {Array} addresses Array of all company address
 * @param {uuid} selectedAddressId address id stored in session data for pre-selected option
  */
const checkDetailsForm = (request) => {
  const { csrfToken } = request.view;
  const regionId = request.params.regionId || '';
  const companyId = request.params.companyId || '';
  const action = urlJoin('/invoice-accounts/create', regionId, companyId, 'check-details');
  const f = formFactory(action, 'POST');
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

exports.checkDetailsForm = checkDetailsForm;
