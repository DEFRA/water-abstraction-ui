const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');
const { getUnitsField } = require('shared/modules/returns/forms/units');
const { formFactory, setValues } = require('shared/lib/forms');

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getUnitsField('Which units were used?'),
    getContinueField()
  ]
}, { units: data.reading.units });
