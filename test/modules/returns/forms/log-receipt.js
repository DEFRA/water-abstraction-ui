const { expect } = require('code');
const moment = require('moment');
const { experiment, test } = exports.lab = require('lab').script();
const { logReceiptForm } = require('../../../../src/modules/returns/forms/log-receipt');

experiment('logReceiptForm', () => {
  test('should generate a form object from request', async () => {
    const today = moment().format('YYYY-MM-DD');

    const request = {
      view: {
        csrfToken: 'xyz'
      },
      query: {
        returnId: 'abc'
      },
      permissions: {
        hasPermission: () => {
          return true;
        }
      }
    };

    const form = logReceiptForm(request);

    expect(form).to.equal({
      'action': '/admin/return/log-receipt?returnId=abc',
      'method': 'POST',
      'isSubmitted': false,
      'fields': [
        {
          'name': 'csrf_token',
          'value': 'xyz',
          'options': {
            'widget': 'text',
            'type': 'hidden',
            'label': null,
            'required': true
          }
        },
        {
          'name': 'date_received',
          'value': today,
          'options': {
            'label': 'Enter date received?',
            'widget': 'date',
            'required': true,
            'mapper': 'dateMapper',
            'hint': 'For example, 31 3 2018',
            'errors': {
              'any.required': {
                'message': 'Enter a valid date'
              },
              'date.isoDate': {
                'message': 'Enter a valid date'
              }
            }
          },
          'errors': []
        },
        {
          'name': null,
          'value': undefined,
          'options': {
            'widget': 'button',
            'label': 'Submit'
          }
        }
      ],
      'errors': [],
      'validationType': 'joi',
      'isValid': undefined
    });
  });
});
