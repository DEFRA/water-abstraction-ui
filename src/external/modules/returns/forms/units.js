const { getContinueField, getCsrfTokenField, getHeadingField } =
 require('shared/modules/returns/forms/common');
const { getUnitsField } = require('shared/modules/returns/forms/units');
const { formFactory, setValues } = require('shared/lib/forms');

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getHeadingField('Which units are you using?'),
    getUnitsField(),
    getContinueField()
  ]
}, { units: data.reading.units });
