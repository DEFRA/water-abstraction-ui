const { getContinueField, getCsrfTokenField, getHeadingField, getParagraphField } =
 require('shared/modules/returns/forms/common');
const { getLineFields, schema } = require('shared/modules/returns/forms/quantities');
const { formFactory, setValues } = require('shared/lib/forms');
const { getLineValues } = require('shared/modules/returns/forms/quantities');

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getParagraphField('Volumes entered should be calculated manually.'),
    getParagraphField('Take into consideration the x10 display.'),
    getHeadingField('Volumes'),
    ...getLineFields(data),
    getContinueField()
  ]
}, getLineValues(data.lines));

exports.schema = schema;
