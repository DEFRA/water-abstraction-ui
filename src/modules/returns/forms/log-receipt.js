const { get } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('../../../lib/forms');
const { STEP_LOG_RECEIPT, getPath } = require('../lib/flow-helpers');

const form = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_LOG_RECEIPT, request);

  const f = formFactory(action);
  const dateReceived = get(data, 'receivedDate') || moment().format('YYYY-MM-DD');

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  f.fields.push(fields.date('date_received', {
    label: 'Enter date received?',
    hint: 'For example, 31 3 2018',
    errors: {
      'any.required': {
        message: 'Enter a valid date'
      },
      'date.isoDate': {
        message: 'Enter a valid date'
      }
    }}, dateReceived));

  f.fields.push(fields.button(null, { label: 'Submit' }));

  return f;
};

module.exports = {
  logReceiptForm: form
};
