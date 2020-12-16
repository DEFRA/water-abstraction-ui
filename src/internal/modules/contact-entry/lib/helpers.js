const { CONTACT_TYPES } = require('./constants');
const { get } = require('lodash');
const session = require('../lib/session');

/**
 * Returns value to be stored in the session
 * @param {String} selected value from form: guid|department
 * @param {String} department
 */
const getSelectedContact = (selected, department) => {
  if (selected === CONTACT_TYPES.department) {
    return {
      type: CONTACT_TYPES.department,
      department
    };
  }

  return { contactId: selected };
};

const getContactFromSession = request =>
  get(session.get(request, request.params.key), 'data', {});

exports.getSelectedContact = getSelectedContact;
exports.getContactFromSession = getContactFromSession;
