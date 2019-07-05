const { getContinueField, getCsrfTokenField, getHeadingField, getParagraphField } =
 require('shared/modules/returns/forms/common');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms');

const getValue = data => {
  const method = get(data, 'reading.method');
  const type = get(data, 'reading.type');
  return `${method},${type}`;
};

exports.form = (request, data) => ({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getHeadingField('How are you reporting your figures?'),
    getParagraphField('If you used more than one meter you must provide volumes'),
    fields.radio('method', {
      errors: {
        'any.required': {
          message: 'Select readings from one meter, or other (abstraction volumes)'
        }
      },
      choices: [
        { value: 'oneMeter,measured', label: 'Readings from a single meter' },
        { value: 'abstractionVolumes,measured', label: 'Volumes from one or more meters' },
        { value: 'abstractionVolumes,estimated', label: 'Estimates without a meter' }
      ] }, getValue(data)),
    getContinueField()
  ]
});
