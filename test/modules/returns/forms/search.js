const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { searchForm } = require('../../../../src/modules/returns/forms/index');

experiment('Returns search form', () => {
  const form = searchForm();

  test('it should be checked if isUnderQuery flag is true', async () => {
    expect(form).to.equal({
      'action': '/admin/returns',
      'method': 'GET',
      'isSubmitted': false,
      'isValid': undefined,
      'fields': [
        {
          'name': 'query',
          'options': {
            'label': 'Enter a return ID',
            'widget': 'text',
            'required': true,
            'type': 'text',
            'controlClass': 'form-control',
            'autoComplete': true,
            'errors': {
              'any.empty': {
                'message': 'You must enter a number'
              }
            }
          },
          'value': undefined,
          'errors': []
        },
        {
          'name': null,
          'options': {
            'widget': 'button',
            'label': 'Continue'
          },
          'value': undefined
        }
      ],
      'errors': [],
      'validationType': 'joi'
    });
  });
});
