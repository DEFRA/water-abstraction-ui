const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');
const { getUnitsField } = require('shared/modules/returns/forms/units');
const { formFactory, setValues } = require('shared/lib/forms');
const { get } = require('lodash');

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getUnitsField('Which units are you using?'),
    getContinueField()
  ]
}, { units: get(data, 'reading.units') });
