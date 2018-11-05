const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { internalRoutingForm } = require('../../../../src/modules/returns/forms/internal-routing');

experiment('internalRoutingForm', () => {
  test('should generate a form object from request', async () => {
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

    const form = internalRoutingForm(request);

    expect(form).to.equal({
      'isValid': undefined,
      'action': '/admin/return/internal?returnId=abc',
      'method': 'POST',
      'isSubmitted': false,
      'fields': [
        {
          'name': 'action',
          'value': undefined,
          'options': {
            'choices': [
              {
                'value': 'log_receipt',
                'label': 'Log receipt (and come back to it later)'
              },
              {
                'value': 'submit',
                'label': 'Enter and submit it'
              }
            ],
            'label': 'What would you like to do with this return?',
            'widget': 'radio',
            'required': true,
            'errors': {
              'any.required': {
                'message': 'Select what you would like to do with this return'
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
            'label': 'Continue'
          }
        },
        {
          'name': 'csrf_token',
          'value': 'xyz',
          'options': {
            'widget': 'text',
            'type': 'hidden',
            'label': null,
            'required': true
          }
        }
      ],
      'errors': [],
      'validationType': 'joi'
    });
  });
});
